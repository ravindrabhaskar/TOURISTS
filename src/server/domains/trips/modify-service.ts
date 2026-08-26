import { z } from "zod";
import { db } from "@/server/db";
import { errors } from "@/lib/http";
import { loadCandidates, getTripForOwner } from "./service";
import { addStop, deprioritizeWeatherSensitive, removeItem, shiftDay } from "./engine/modify";
import type { DraftItem } from "./engine/types";

export const modificationSchema = z.discriminatedUnion("op", [
  z.object({ op: z.literal("remove"), match: z.string().min(2).max(80), dayNumber: z.coerce.number().int().min(1).max(30) }),
  z.object({ op: z.literal("shift"), deltaMinutes: z.coerce.number().int().min(-240).max(240), dayNumber: z.coerce.number().int().min(1).max(30) }),
  z.object({ op: z.literal("weather"), dayNumber: z.coerce.number().int().min(1).max(30) }),
  z.object({ op: z.literal("add"), slug: z.string(), dayNumber: z.coerce.number().int().min(1).max(30) }),
]);

export type ModificationInput = z.infer<typeof modificationSchema>;

/** Applies a day-level modification and persists the recomputed timeline.
 * Locked items (booked slots) are never moved or removed. */
export async function applyTripModification(
  userId: string,
  tripId: string,
  raw: unknown,
): Promise<{ notes: string[]; warnings: string[]; dayNumber: number }> {
  const parsed = modificationSchema.safeParse(raw);
  if (!parsed.success) throw errors.badRequest("Invalid modification request.");
  const body = parsed.data;

  const trip = await getTripForOwner(tripId, userId);
  const day = trip.days_.find((d) => d.dayNumber === body.dayNumber);
  if (!day) throw errors.notFound("That day does not exist on this trip.");

  const toDraft = (i: (typeof day.items)[number]): DraftItem => ({
    itemType: i.itemType,
    title: i.title,
    description: i.description ?? undefined,
    reason: i.reason ?? undefined,
    destinationId: i.destinationId ?? undefined,
    placeName: i.placeName ?? undefined,
    lat: i.lat ?? undefined,
    lng: i.lng ?? undefined,
    startTimeMin: i.startTimeMin,
    endTimeMin: i.endTimeMin,
    travelFromPrevMinutes: i.travelFromPrevMinutes,
    estimatedCostPerPerson: i.estimatedCostPerPerson,
    bookingRequired: i.bookingRequired,
    weatherSensitive: i.weatherSensitive,
    locked: i.locked,
  });

  let result;
  if (body.op === "add") {
    const candidates = await loadCandidates();
    const poi = candidates.find((c) => c.slug === body.slug);
    if (!poi) throw errors.notFound("Place not found in catalog.");
    result = addStop(day.items.map(toDraft), {
      id: poi.id,
      slug: poi.slug,
      name: poi.name,
      lat: poi.lat,
      lng: poi.lng,
      summary: poi.summary.slice(0, 160),
      durationMin: poi.visitDurationMin,
      costPerPerson: poi.entryFeeAdult ?? 0,
      weatherSensitive: poi.weatherSensitive,
    });
  } else {
    const draftItems = day.items.map(toDraft);
    if (body.op === "remove") result = removeItem(draftItems, new RegExp(body.match.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"));
    else if (body.op === "shift") result = shiftDay(draftItems, body.deltaMinutes);
    else result = deprioritizeWeatherSensitive(draftItems);
  }

  await db.$transaction([
    db.itineraryItem.deleteMany({ where: { dayId: day.id } }),
    ...result.items.map((item, idx) =>
      db.itineraryItem.create({
        data: {
          dayId: day.id,
          position: idx,
          itemType: item.itemType,
          startTimeMin: Math.round(item.startTimeMin),
          endTimeMin: Math.round(item.endTimeMin),
          title: item.title,
          description: item.description ?? null,
          reason: item.reason ?? null,
          destinationId: item.destinationId ?? null,
          placeName: item.placeName ?? null,
          lat: item.lat ?? null,
          lng: item.lng ?? null,
          travelFromPrevMinutes: item.travelFromPrevMinutes,
          estimatedCostPerPerson: item.estimatedCostPerPerson,
          bookingRequired: item.bookingRequired,
          weatherSensitive: item.weatherSensitive,
          locked: item.locked ?? false,
        },
      }),
    ),
  ]);

  return { notes: result.notes, warnings: result.warnings, dayNumber: body.dayNumber };
}
