import { z } from "zod";
import { errors, handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { requireUser } from "@/server/auth/guard";
import { createBooking, listUserBookings } from "@/server/domains/bookings";

const createSchema = z.object({
  type: z.enum(["STAY_ROOM", "PACKAGE", "EVENT_TICKET", "ATTRACTION", "TRANSPORT", "GUIDE"]),
  roomId: z.string().optional(),
  packageId: z.string().optional(),
  tripId: z.string().optional(),
  titleSnapshot: z.string().min(2).max(200),
  quantity: z.number().int().min(1).max(20),
  unitPrice: z.number().int().min(0),
  startsOn: z.coerce.date().optional(),
  nights: z.number().int().min(1).max(30).optional(),
  travellerDetails: z.record(z.string(), z.unknown()).optional(),
  idempotencyKey: z.string().max(80).optional(),
});

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok(await listUserBookings(user.id));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    guardRate(req, "api:bookings", 12, 300);
    const user = await requireUser();
    const parsed = createSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) throw errors.badRequest("Invalid booking payload.", parsed.error.flatten());
    const booking = await createBooking({ ...parsed.data, userId: user.id });
    return ok(booking, 201);
  });
}
