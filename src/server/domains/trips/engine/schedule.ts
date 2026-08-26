import type { CandidatePoi, DraftItem, Pace } from "./types";
import { roadDistanceKm, travelMinutes } from "@/lib/geo";

// ── Day-level scheduling constants (documented planning heuristics) ─────────
export const DAY_START: Record<Pace, number> = { RELAXED: 9 * 60 + 30, BALANCED: 8 * 60 + 30, PACKED: 8 * 60 };
export const DAY_END_SOFT: Record<Pace, number> = { RELAXED: 18 * 60, BALANCED: 19 * 60 + 30, PACKED: 21 * 60 };
export const LUNCH_START = 12 * 60 + 30;
export const DINNER_START = 19 * 60 + 30;
const LUNCH_MIN = 45;
const DINNER_MIN = 60;

export const MEAL_COST: Record<string, number> = { BUDGET: 150, MID: 350, PREMIUM: 650, LUXURY: 1200 };

function meal(itemType: "MEAL", title: string, start: number, cost: number, placeName?: string): DraftItem {
  return {
    itemType,
    title,
    startTimeMin: start,
    endTimeMin: start + (itemType === "MEAL" ? LUNCH_MIN : DINNER_MIN),
    travelFromPrevMinutes: 0,
    estimatedCostPerPerson: cost,
    bookingRequired: false,
    weatherSensitive: false,
    reason: undefined,
    placeName,
  };
}

/** Nearest-neighbour ordering to minimise intra-day travel. */
export function orderStops(stops: CandidatePoi[], startLat: number, startLng: number): CandidatePoi[] {
  const remaining = [...stops];
  const ordered: CandidatePoi[] = [];
  let curLat = startLat;
  let curLng = startLng;
  while (remaining.length) {
    let bestIdx = 0;
    let bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = roadDistanceKm(curLat, curLng, s.lat, s.lng);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    const next = remaining.splice(bestIdx, 1)[0]!;
    ordered.push(next);
    curLat = next.lat;
    curLng = next.lng;
  }
  return ordered;
}

type ScheduleStopInput = {
  stop: CandidatePoi;
  durationMin: number;
};

/**
 * Build one day's timeline. Deterministic: respects opening hours where known
 * (shifts arrival to opening time; drops the stop when it cannot fit), inserts
 * lunch/dinner at conventional windows, and never exceeds the soft day end by
 * more than dinner. Pure — fully unit-testable.
 */
export function scheduleDay(opts: {
  stops: ScheduleStopInput[];
  startMin: number;
  pace: Pace;
  mealCost: number;
  startPlaceName?: string;
  includeDinner?: boolean;
}): { items: DraftItem[]; droppedStops: Array<{ name: string; why: string }> } {
  const items: DraftItem[] = [];
  const dropped: Array<{ name: string; why: string }> = [];
  let cursor = opts.startMin;
  let curLat: number | null = null;
  let curLng: number | null = null;

  items.push(
    meal("MEAL", "Breakfast", Math.min(cursor, 8 * 60 + 30), Math.round(opts.mealCost * 0.5), opts.startPlaceName),
  );
  cursor = Math.max(cursor, 8 * 60 + 30 + LUNCH_MIN);

  for (const { stop, durationMin } of opts.stops) {
    if (cursor >= DAY_END_SOFT[opts.pace]) {
      dropped.push({ name: stop.name, why: "Not enough time left in the day" });
      continue;
    }
    const km = curLat != null && curLng != null ? roadDistanceKm(curLat!, curLng!, stop.lat, stop.lng) : 0;
    const travel = curLat == null ? 0 : travelMinutes(km);
    let arrival = cursor + travel;

    // Opening-hours feasibility: shift to open time or drop with a reason.
    const hours = stop.openingHours ?? [];
    if (hours.length > 0) {
      // Engine works on generic minutes; weekday-specific checks happen at
      // persistence time via fitsVisit(). Here we use the widest daily window.
      const windows = hours.map((w) => ({ open: w.open, close: w.close }));
      const openM = Math.min(...windows.map((w) => Number(w.open.split(":")[0]) * 60 + Number(w.open.split(":")[1])));
      let closeM = Math.max(...windows.map((w) => Number(w.close.split(":")[0]) * 60 + Number(w.close.split(":")[1])));
      if (closeM <= openM) closeM += 1440;
      if (arrival < openM && openM + durationMin <= closeM) {
        arrival = openM;
      }
      if (arrival + durationMin > closeM) {
        dropped.push({ name: stop.name, why: "Visiting hours do not fit the schedule" });
        continue;
      }
    }

    if (cursor < LUNCH_START && arrival > LUNCH_START && !items.some((i) => i.title === "Lunch")) {
      const lunchAt = LUNCH_START;
      items.push(meal("MEAL", "Lunch", lunchAt, opts.mealCost));
      cursor = lunchAt + LUNCH_MIN;
      arrival = cursor + travel;
    }

    items.push({
      itemType: "ATTRACTION",
      title: stop.name,
      description: stop.summary,
      destinationId: stop.id,
      destinationSlug: stop.slug,
      placeName: stop.districtName,
      lat: stop.lat,
      lng: stop.lng,
      startTimeMin: arrival,
      endTimeMin: arrival + durationMin,
      travelFromPrevMinutes: travel,
      estimatedCostPerPerson: stop.entryFeeAdult ?? 0,
      bookingRequired: false,
      weatherSensitive: stop.weatherSensitive,
      reason: stop.categories[0]
        ? `Matches your interest in ${stop.categories[0].replace(/_/g, " ").toLowerCase()}`
        : `Popular in ${stop.districtName}`,
    });
    cursor = arrival + durationMin + 10; // 10-min buffer between stops
    curLat = stop.lat;
    curLng = stop.lng;
  }

  if (!items.some((i) => i.title === "Lunch")) {
    items.push(meal("MEAL", "Lunch", Math.min(LUNCH_START, Math.max(cursor - 60, LUNCH_START)), opts.mealCost));
  }

  if (opts.includeDinner !== false) {
    const lastEnd = items.reduce((m, i) => Math.max(m, i.endTimeMin), cursor);
    const dinnerStart = Math.max(DINNER_START, lastEnd + 20);
    items.push(meal("MEAL", "Dinner — local cuisine", dinnerStart, opts.mealCost));
  }

  items.sort((a, b) => a.startTimeMin - b.startTimeMin || a.endTimeMin - b.endTimeMin);
  return { items, droppedStops: dropped };
}

/** Resequence an existing day after add/remove/shift while preserving locked items' times.
 * `respectGivenOrder` keeps the caller-provided sequence (used by weather deprioritisation)
 * instead of re-sorting by start time. */
export function resequenceDay(
  items: DraftItem[],
  startMin: number,
  opts?: { respectGivenOrder?: boolean },
): DraftItem[] {
  const sorted = [...items].sort((a, b) => {
    if (a.locked !== b.locked) return a.locked ? -1 : 1;
    if (!opts?.respectGivenOrder) return a.startTimeMin - b.startTimeMin;
    return 0;
  });
  let cursor = startMin;
  let prevEnd: number | null = null;
  for (const it of sorted) {
    if (it.locked) {
      cursor = Math.max(cursor, it.endTimeMin);
      prevEnd = it.endTimeMin;
      continue;
    }
    if (it.itemType === "ATTRACTION" || it.itemType === "ACTIVITY" || it.itemType === "EVENT") {
      const dur = it.endTimeMin - it.startTimeMin;
      const start = Math.max(cursor + it.travelFromPrevMinutes, prevEnd ?? cursor);
      it.startTimeMin = start;
      it.endTimeMin = start + dur;
      cursor = it.endTimeMin + 10;
    } else {
      const dur = it.endTimeMin - it.startTimeMin;
      const minStart = it.title.startsWith("Breakfast") ? it.startTimeMin : Math.max(it.startTimeMin, cursor);
      it.startTimeMin = minStart;
      it.endTimeMin = minStart + dur;
      cursor = it.endTimeMin;
    }
    prevEnd = it.endTimeMin;
  }
  return sorted;
}

export function dayTitleFor(clusterName: string, stopNames: string[]): string {
  const highlights = stopNames.slice(0, 2).join(" & ");
  return highlights ? `${clusterName} — ${highlights}` : clusterName;
}
