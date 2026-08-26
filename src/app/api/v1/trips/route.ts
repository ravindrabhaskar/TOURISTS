import { z } from "zod";
import { errors, handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { requireUser } from "@/server/auth/guard";
import { createTrip, listUserTrips } from "@/server/domains/trips/service";

const plannerSchema = z.object({
  originName: z.string().min(2).max(80),
  originLat: z.number().min(-90).max(90),
  originLng: z.number().min(-180).max(180),
  startDate: z.coerce.date(),
  days: z.number().int().min(1).max(14),
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20).default(0),
  seniors: z.number().int().min(0).max(20).default(0),
  budgetTotal: z.number().int().positive().optional(),
  transportPreference: z.enum(["CAR", "BUS", "TRAIN", "ANY"]).default("ANY"),
  accommodationPref: z.enum(["BUDGET", "MID", "PREMIUM", "LUXURY"]).default("MID"),
  interests: z.array(z.string()).max(12).default([]),
  pace: z.enum(["RELAXED", "BALANCED", "PACKED"]),
  foodPreference: z.string().max(40).optional(),
  accessibilityNeeds: z.array(z.string()).max(6).default([]),
  preferredSlugs: z.array(z.string()).max(20).optional(),
});

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    return ok(await listUserTrips(user.id));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    guardRate(req, "api:trips-create", 10, 300);
    const user = await requireUser();
    const raw = await req.json().catch(() => null);
    const parsed = plannerSchema.safeParse(raw);
    if (!parsed.success) throw errors.badRequest("Invalid planner input.", parsed.error.flatten());
    const trip = await createTrip(user.id, parsed.data);
    return ok(trip, 201);
  });
}
