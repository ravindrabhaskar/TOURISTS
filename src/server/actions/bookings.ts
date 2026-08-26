"use server";

import { z } from "zod";
import { db } from "@/server/db";
import { errors } from "@/lib/http";
import { requireUser } from "@/server/auth/guard";
import { redirect } from "next/navigation";
import { createBooking, confirmPayment, failPayment } from "@/server/domains/bookings";
import { signSandbox, paymentAdapter } from "@/server/integrations/payments";

const stayCheckoutSchema = z.object({
  roomId: z.string().uuid(),
  nights: z.coerce.number().int().min(1).max(30),
  guests: z.coerce.number().int().min(1).max(10),
  checkIn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  idempotencyKey: z.string().optional(),
});

export async function createStayBookingAction(formData: FormData): Promise<void> {
  let failure: string | null = null;
  let bookingId: string | null = null;
  try {
    const user = await requireUser();
    const parsed = stayCheckoutSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) throw errors.badRequest("Invalid booking details.");

    const room = await db.room.findUnique({ where: { id: parsed.data.roomId }, include: { stay: true } });
    if (!room) throw errors.notFound("Room not found.");

    const booking = await createBooking({
      userId: user.id,
      type: "STAY_ROOM",
      roomId: room.id,
      titleSnapshot: `${room.stay.name} · ${room.name}`,
      quantity: parsed.data.nights,
      unitPrice: room.basePrice,
      startsOn: new Date(parsed.data.checkIn + "T12:00:00"),
      nights: parsed.data.nights,
      travellerDetails: { guests: parsed.data.guests },
      idempotencyKey: parsed.data.idempotencyKey || `stay-${room.id}-${user.id}-${parsed.data.checkIn}-${parsed.data.nights}`,
    });
    bookingId = booking.id;
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e && String((e as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) throw e;
    const err = e as { message?: string; details?: { fieldErrors?: Record<string, string[]> } };
    failure = typeof err.message === "string" && err.message.length < 200 ? err.message : "Could not create the booking. Please try again.";
  }

  if (failure) redirect(`/stays/${String(formData.get("slug") ?? "")}?error=${encodeURIComponent(failure)}`);
  redirect(`/pay/${bookingId}`);
}

/** Sandbox gateway simulation — mirrors what a real hosted checkout would do:
 * it calls back into the platform with a provider signature after "payment". */
export async function sandboxPayAction(formData: FormData): Promise<void> {
  const bookingId = String(formData.get("bookingId") ?? "");
  const outcome = String(formData.get("outcome") ?? "success");
  await requireUser();

  const payment = await db.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
    include: { booking: true },
  });
  if (!payment) redirect("/dashboard/bookings?error=" + encodeURIComponent("Payment record not found."));

  const providerOrderId = payment.providerOrderId;
  const paymentId = `sbx_pay_${Math.random().toString(36).slice(2, 12)}`;
  const signature = signSandbox(providerOrderId, paymentId);

  if (outcome === "fail") {
    await failPayment(payment.provider, providerOrderId, "Cancelled at sandbox checkout");
    redirect("/dashboard/bookings?error=" + encodeURIComponent("Payment failed/cancelled — you can retry from bookings."));
  }

  void paymentAdapter; // adapter selection happens inside confirmPayment
  try {
    await confirmPayment(payment.provider, providerOrderId, paymentId, signature);
  } catch {
    redirect("/dashboard/bookings?error=" + encodeURIComponent("Signature verification failed."));
  }
  redirect("/dashboard/bookings?paid=1");
}
