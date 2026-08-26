import { db } from "@/server/db";
import { errors } from "@/lib/http";
import { bookingReference } from "@/lib/utils";
import { paymentAdapter } from "@/server/integrations/payments";
import { notify } from "./notifications";

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING_PAYMENT: ["CONFIRMED", "CANCELLED", "FAILED"],
  CONFIRMED: ["COMPLETED", "CANCELLED", "REFUNDED"],
  CANCELLED: [],
  FAILED: [],
  REFUNDED: [],
  COMPLETED: [],
};

export function assertTransition(from: string, to: string): void {
  if (!(VALID_TRANSITIONS[from] ?? []).includes(to)) {
    throw errors.badRequest(`Cannot change booking status from ${from} to ${to}.`);
  }
}

export type CreateBookingInput = {
  userId: string;
  type: "STAY_ROOM" | "PACKAGE" | "EVENT_TICKET" | "ATTRACTION" | "TRANSPORT" | "GUIDE";
  roomId?: string;
  packageId?: string;
  tripId?: string;
  titleSnapshot: string;
  quantity: number;
  unitPrice: number;
  startsOn?: Date;
  nights?: number;
  travellerDetails?: Record<string, unknown>;
  idempotencyKey?: string;
};

export async function createBooking(input: CreateBookingInput) {
  if (input.quantity < 1 || input.quantity > 20) throw errors.badRequest("Invalid quantity.");
  if (input.unitPrice < 0) throw errors.badRequest("Invalid price.");

  if (input.idempotencyKey) {
    const existing = await db.booking.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
    if (existing) return existing;
  }

  const total = input.unitPrice * input.quantity;
  const booking = await db.$transaction(async (tx) => {
    // Inventory guard for rooms — prevents overselling the seeded stock.
    if (input.type === "STAY_ROOM" && input.roomId) {
      const room = await tx.room.findUnique({ where: { id: input.roomId }, include: { _count: { select: { bookings: { where: { status: { in: ["PENDING_PAYMENT", "CONFIRMED"] } } } } } } });
      if (!room) throw errors.notFound("Room not found");
      const active = await tx.booking.count({ where: { roomId: input.roomId, status: { in: ["PENDING_PAYMENT", "CONFIRMED"] }, NOT: { userId: input.userId, status: "CANCELLED" } } });
      if (active >= room.totalRooms && room.totalRooms > 0) {
        throw errors.conflict("This room category is fully booked for the selected inventory. Please choose another room.");
      }
      void room._count;
    }
    return tx.booking.create({
      data: {
        reference: bookingReference(),
        userId: input.userId,
        type: input.type,
        roomId: input.roomId ?? null,
        packageId: input.packageId ?? null,
        tripId: input.tripId ?? null,
        titleSnapshot: input.titleSnapshot.slice(0, 200),
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalAmount: total,
        travellerDetails: (input.travellerDetails ?? undefined) as never,
        startsOn: input.startsOn ?? null,
        nights: input.nights ?? null,
        status: "PENDING_PAYMENT",
        idempotencyKey: input.idempotencyKey,
      },
    });
  });

  const adapter = paymentAdapter();
  const order = await adapter.createOrder({
    amountRupees: booking.totalAmount,
    reference: booking.reference,
    notes: { bookingId: booking.id },
  });
  await db.payment.create({
    data: {
      bookingId: booking.id,
      provider: order.provider,
      providerOrderId: order.providerOrderId,
      amount: booking.totalAmount,
      status: "CREATED",
    },
  });

  return { ...booking, checkoutUrl: order.checkoutUrl, paymentProvider: order.provider };
}

/** Confirms a payment server-side. Called ONLY after provider signature
 * verification (webhook or hosted-return verification) — never from raw client claims. */
export async function confirmPayment(provider: string, providerOrderId: string, providerPaymentId: string, signature: string) {
  const adapter = paymentAdapter();
  if (!adapter.verifySignature({ orderId: providerOrderId, paymentId: providerPaymentId, signature })) {
    throw errors.badRequest("Payment signature verification failed.");
  }
  const payment = await db.payment.findUnique({ where: { provider_providerOrderId: { provider, providerOrderId } }, include: { booking: true } });
  if (!payment) throw errors.notFound("Payment not found");

  const result = await db.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id: payment.id },
      data: { status: "CAPTURED", providerPaymentId, method: adapter.isLive() ? "gateway" : "sandbox" },
    });
    assertTransition(payment.booking.status, "CONFIRMED");
    const booking = await tx.booking.update({ where: { id: payment.bookingId }, data: { status: "CONFIRMED" } });
    return { updated, booking };
  });

  await notify({
    userId: payment.booking.userId,
    type: "BOOKING",
    title: `Booking confirmed · ${payment.booking.reference}`,
    body: `${payment.booking.titleSnapshot} — ₹${payment.booking.totalAmount.toLocaleString("en-IN")} paid.`,
    linkUrl: "/dashboard/bookings",
  });
  return result.booking;
}

export async function failPayment(provider: string, providerOrderId: string, reason: string) {
  const payment = await db.payment.findUnique({ where: { provider_providerOrderId: { provider, providerOrderId } }, include: { booking: true } });
  if (!payment || payment.status === "CAPTURED") return;
  await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", failureReason: reason.slice(0, 300) } });
  if ((VALID_TRANSITIONS[payment.booking.status] ?? []).includes("FAILED")) {
    await db.booking.update({ where: { id: payment.bookingId }, data: { status: "FAILED" } });
  }
}

export async function listUserBookings(userId: string) {
  return db.booking.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

export async function cancelBooking(bookingId: string, userId: string) {
  const booking = await db.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.userId !== userId) throw errors.notFound("Booking not found");
  assertTransition(booking.status, "CANCELLED");
  return db.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
}
