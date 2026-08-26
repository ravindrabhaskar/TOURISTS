import type { DraftItem } from "./types";
import { resequenceDay } from "./schedule";
import { roadDistanceKm } from "@/lib/geo";

export type ModifyResult = {
  items: DraftItem[];
  notes: string[];
  warnings: string[];
};

/** Remove an item (e.g. "skip the museum") and reflow the day. Locked/booked items are never removed silently. */
export function removeItem(items: DraftItem[], titleMatch: RegExp | string): ModifyResult {
  const target = typeof titleMatch === "string" ? new RegExp(titleMatch, "i") : titleMatch;
  const victim = items.find((i) => target.test(i.title) && !i.locked);
  if (!victim) {
    return { items, notes: [], warnings: ["Could not find a removable item matching that request."] };
  }
  const rest = items.filter((i) => i !== victim);
  return {
    items: resequenceDay(rest, firstStart(items)),
    notes: [`Removed “${victim.title}”.`],
    warnings: [],
  };
}

/** "We're running X minutes late" — shift every unlocked item by delta.
 * Times move as requested; only ordering is normalised. Locked slots never move. */
export function shiftDay(items: DraftItem[], deltaMinutes: number): ModifyResult {
  const shifted = items.map((i) =>
    i.locked ? i : { ...i, startTimeMin: i.startTimeMin + deltaMinutes, endTimeMin: i.endTimeMin + deltaMinutes },
  );
  const ordered = [...shifted].sort((a, b) => a.startTimeMin - b.startTimeMin);
  return {
    items: ordered,
    notes: [`Shifted the schedule by ${deltaMinutes > 0 ? "+" : ""}${Math.round(deltaMinutes)} minutes.`],
    warnings: [],
  };
}

/**
 * Weather-aware adjustment: move weather-sensitive stops later in the day
 * (showers often pass) and flag them; indoor/meal items stay put.
 */
export function deprioritizeWeatherSensitive(items: DraftItem[]): ModifyResult {
  const notes: string[] = [];
  const sorted = [...items].sort((a, b) => {
    const aw = a.weatherSensitive && !a.locked ? 1 : 0;
    const bw = b.weatherSensitive && !b.locked ? 1 : 0;
    return aw - bw; // ascending: indoor stops stay early, outdoor stops sink later
  });
  notes.push("Rain expected — outdoor stops moved later in the day where possible. Carry rain protection and check alerts before heading out.");
  return { items: resequenceDay(sorted, firstStart(items), { respectGivenOrder: true }), notes, warnings: [] };
}

/** Add a nearby stop to the least-loaded part of the day. */
export function addStop(
  items: DraftItem[],
  stop: { id?: string; slug?: string; name: string; lat: number; lng: number; summary?: string; durationMin: number; costPerPerson: number; weatherSensitive?: boolean },
): ModifyResult {
  const anchor = items.find((i) => i.itemType === "ATTRACTION" && i.lat != null) ?? items[0];
  const travelMin =
    anchor?.lat != null && anchor?.lng != null ? Math.round((roadDistanceKm(anchor.lat, anchor.lng, stop.lat, stop.lng) / 38) * 60) + 10 : 20;
  const lastEnd = items.reduce((m, i) => Math.max(m, i.endTimeMin), 0);
  const start = Math.max(9 * 60, Math.min(lastEnd + travelMin, 18 * 60));
  const newItem: DraftItem = {
    itemType: "ATTRACTION",
    title: stop.name,
    description: stop.summary,
    destinationId: stop.id,
    destinationSlug: stop.slug,
    placeName: undefined,
    lat: stop.lat,
    lng: stop.lng,
    startTimeMin: start,
    endTimeMin: start + stop.durationMin,
    travelFromPrevMinutes: travelMin,
    estimatedCostPerPerson: stop.costPerPerson,
    bookingRequired: false,
    weatherSensitive: stop.weatherSensitive ?? false,
    reason: "Added from your modification request",
  };
  const next = [...items.filter((i) => i.endTimeMin <= start), newItem, ...items.filter((i) => i.endTimeMin > start)];
  return {
    items: resequenceDay(next, firstStart(items)),
    notes: [`Added ${stop.name} to the day.`],
    warnings: start >= 18 * 60 ? ["The day was already full — this addition makes it tight."] : [],
  };
}

function firstStart(items: DraftItem[]): number {
  return items.reduce((m, i) => Math.min(m, i.startTimeMin), Infinity) === Infinity ? 8 * 60 + 30 : Math.min(...items.map((i) => i.startTimeMin));
}
