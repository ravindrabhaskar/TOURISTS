import type { CandidatePoi, CostBreakdown, ItineraryDraft, PlannerInput } from "./types";
import { DAY_START, MEAL_COST, dayTitleFor, orderStops, scheduleDay } from "./schedule";
import { roadDistanceKm } from "@/lib/geo";

const STAY_NIGHTLY: Record<string, number> = { BUDGET: 1200, MID: 2600, PREMIUM: 5200, LUXURY: 9500 };
export const MAX_STOPS_PER_DAY = { RELAXED: 2, BALANCED: 3, PACKED: 4 } as const;
const DURATION_CAP = { RELAXED: 90, BALANCED: 150, PACKED: 180 } as const;

export function scoreCandidate(poi: CandidatePoi, input: PlannerInput): number {
  let score = poi.popularityScore / 10 + poi.ratingAvg * 2;
  for (const interest of input.interests) {
    const t = interest.toLowerCase();
    if (poi.categories.some((c) => c.toLowerCase().includes(t)) || poi.tags.some((g) => g.toLowerCase().includes(t))) {
      score += 6;
    }
  }
  if ((input.seniors > 0 || input.accessibilityNeeds.length > 0) && poi.easyAccess) score += 5;
  if (poi.entryFeeAdult && input.budgetTotal && input.budgetTotal < 15000) score -= 1;
  return score;
}

/** Wheelchair needs hard-filter easy-access POIs; otherwise soft-preference ordering. */
export function filterAccessible(pois: CandidatePoi[], input: PlannerInput): CandidatePoi[] {
  const strictWheelchair = input.accessibilityNeeds.some((n) => /wheelchair|mobility scooter/i.test(n));
  if (!strictWheelchair) return pois;
  const accessible = pois.filter((p) => p.easyAccess);
  return accessible.length > 0 ? accessible : pois;
}

export function clusterByDistrict(pois: CandidatePoi[]): Map<string, CandidatePoi[]> {
  const map = new Map<string, CandidatePoi[]>();
  for (const p of pois) {
    const arr = map.get(p.districtId) ?? [];
    arr.push(p);
    map.set(p.districtId, arr);
  }
  return map;
}

function rankClusters(
  clustered: Map<string, CandidatePoi[]>,
  scoredById: Map<string, number>,
): Array<{ districtId: string; districtName: string; pois: CandidatePoi[]; strength: number }> {
  const clusters = [...clustered.entries()].map(([districtId, pois]) => {
    const sorted = [...pois].sort((a, b) => (scoredById.get(b.id) ?? 0) - (scoredById.get(a.id) ?? 0));
    return {
      districtId,
      districtName: sorted[0]!.districtName,
      pois: sorted,
      strength: sorted.reduce((s, p) => s + (scoredById.get(p.id) ?? 0), 0),
    };
  });
  clusters.sort((a, b) => b.strength - a.strength);
  return clusters;
}

function stayNightly(level: string): number {
  return STAY_NIGHTLY[level.toUpperCase()] ?? STAY_NIGHTLY.MID!;
}

function downgradeAccommodation(level: string): string {
  const ladder = ["LUXURY", "PREMIUM", "MID", "BUDGET"];
  const i = ladder.indexOf(level.toUpperCase());
  return ladder[Math.min(ladder.length - 1, i + 1)]!;
}

export function estimateCost(
  input: PlannerInput,
  days: Array<{ items: Array<{ estimatedCostPerPerson: number; itemType: string }> }>,
  accommodationLevel: string,
  legsKm: number[],
): CostBreakdown {
  const travellers = input.adults + input.children + input.seniors;
  const travellersEq = input.adults + Math.round(input.children * 0.5); // children ~half fare for entry/transport
  const nights = Math.max(0, input.days - 1);
  const rooms = Math.max(1, Math.ceil(travellers / 2));
  const mode = input.transportPreference === "TRAIN" ? "TRAIN" : input.transportPreference === "CAR" ? "CAR" : "BUS";
  const roundTrips = mode === "CAR" ? 2 : 2;

  const stay = nights * rooms * stayNightly(accommodationLevel);
  const transport =
    legsKm.reduce((sum, km) => sum + transportCostPerPersonRaw(km, mode), 0) * travellersEq * roundTrips;
  const food =
    days.reduce(
      (sum, d) =>
        sum +
        d.items.filter((i) => i.itemType === "MEAL").reduce((s, i) => s + i.estimatedCostPerPerson, 0) * travellersEq,
      0,
    );
  const activities =
    days.reduce(
      (sum, d) =>
        sum +
        d.items
          .filter((i) => i.itemType === "ATTRACTION" || i.itemType === "ACTIVITY")
          .reduce((s, i) => s + i.estimatedCostPerPerson, 0) *
          travellersEq,
      0,
    );

  const total = Math.round(stay + transport + food + activities);
  return {
    stay: Math.round(stay),
    transport: Math.round(transport),
    food: Math.round(food),
    activities: Math.round(activities),
    total,
    perPersonApprox: Math.round(total / Math.max(1, travellers)),
    notes: [],
  };
}

function transportCostPerPersonRaw(km: number, mode: string): number {
  switch (mode) {
    case "CAR":
      return Math.round((km * 18) / 4); // fuel+maintenance split across seats
    case "TRAIN":
      return Math.round(km * 1.6);
    default:
      return Math.round(km * 2.2);
  }
}

/**
 * Deterministic trip draft builder. Pure given candidates — DB access happens
 * in the caller (trips service), so this is fully unit-testable.
 */
export function buildDraft(input: PlannerInput, allCandidates: CandidatePoi[]): ItineraryDraft {
  const warnings: string[] = [];
  const explanation: string[] = [];

  const pool = filterAccessible(allCandidates, input);
  const scored = new Map<string, number>();
  for (const p of pool) scored.set(p.id, scoreCandidate(p, input));
  for (const slug of input.preferredSlugs ?? []) {
    const p = pool.find((x) => x.slug === slug);
    if (p) scored.set(p.id, (scored.get(p.id) ?? 0) + 100);
  }

  const clusters = rankClusters(clusterByDistrict(pool), scored);
  if (clusters.length === 0) {
    return {
      days: [],
      cost: emptyCost(),
      explanation: ["No matching places found yet. Try broadening interests or travel dates."],
      warnings: [],
    };
  }

  const mealCost = MEAL_COST[input.accommodationPref ?? "MID"] ?? MEAL_COST.MID!;

  const dayAssignments: Array<{ districtName: string; pois: CandidatePoi[] }> = [];
  for (let d = 0; d < input.days; d++) {
    const c = clusters[d % clusters.length]!;
    dayAssignments.push({ districtName: c.districtName, pois: c.pois });
  }

  const legsKm: number[] = [];
  const firstAnchor = dayAssignments[0]!.pois[0]!;
  const originLegKm = roadDistanceKm(input.originLat, input.originLng, firstAnchor.lat, firstAnchor.lng);
  legsKm.push(originLegKm);
  let prevAnchor: { lat: number; lng: number } | null = firstAnchor;
  for (let d = 1; d < dayAssignments.length; d++) {
    const anchor = dayAssignments[d]!.pois[0]!;
    const km = roadDistanceKm(prevAnchor!.lat, prevAnchor!.lng, anchor.lat, anchor.lng);
    if (km > 15) legsKm.push(km);
    prevAnchor = anchor;
  }

  const days = dayAssignments.map((assignment, idx) => {
    const stops = assignment.pois.slice(0, MAX_STOPS_PER_DAY[input.pace]).map((stop) => ({
      stop,
      durationMin: Math.min(stop.visitDurationMin, DURATION_CAP[input.pace]),
    }));
    const anchor = assignment.pois[0]!;
    const ordered = orderStops(
      stops.map((s) => s.stop),
      idx === 0 ? input.originLat : anchor.lat,
      idx === 0 ? input.originLng : anchor.lng,
    );
    const orderedStops = ordered
      .map((stop) => ({ stop, durationMin: stops.find((s) => s.stop.id === stop.id)?.durationMin ?? stop.visitDurationMin }));
    const scheduled = scheduleDay({
      stops: orderedStops,
      startMin: DAY_START[input.pace],
      pace: input.pace,
      mealCost,
      startPlaceName: idx === 0 ? input.originName : undefined,
    });
    for (const drop of scheduled.droppedStops) {
      warnings.push(`Day ${idx + 1}: skipped ${drop.name} — ${drop.why.toLowerCase()}.`);
    }
    return {
      dayNumber: idx + 1,
      date: new Date(new Date(input.startDate).getTime() + idx * 86400000),
      title: dayTitleFor(assignment.districtName, orderedStops.map((s) => s.stop.name)),
      clusterName: assignment.districtName,
      items: scheduled.items,
    };
  });

  let level = (input.accommodationPref ?? "MID").toUpperCase();
  let cost = estimateCost(input, days, level, legsKm);
  if (input.budgetTotal && cost.total > input.budgetTotal) {
    const downgraded = downgradeAccommodation(level);
    if (downgraded !== level) {
      const retry = estimateCost(input, days, downgraded, legsKm);
      if (retry.total < cost.total) {
        cost = retry;
        level = downgraded;
        cost.notes.push(`Stay tier adjusted to ${downgraded.toLowerCase()} to move closer to your ₹${input.budgetTotal.toLocaleString("en-IN")} budget.`);
      }
    }
    if (cost.total > input.budgetTotal) {
      cost.notes.push(`Estimate ₹${cost.total.toLocaleString("en-IN")} still exceeds your stated budget — consider trimming a day or choosing bus transport.`);
    }
  }

  const areasCovered = [...new Set(days.map((d) => d.clusterName))];
  explanation.push(`${input.days}-day plan from ${input.originName} covering ${areasCovered.length} area(s): ${areasCovered.join(", ")}.`);
  explanation.push(input.interests.length ? `Prioritised for your interests: ${input.interests.join(", ").toLowerCase()}.` : "Prioritised by popularity and traveller ratings.");
  if (input.seniors > 0 || input.accessibilityNeeds.length > 0) {
    explanation.push("Senior-friendly pacing applied — easier access points and shorter days prioritised.");
  }
  if ((input.preferredSlugs?.length ?? 0) > 0) explanation.push("Your selected must-visit places were placed first.");

  return { days, cost, explanation, warnings: [...new Set(warnings)] };
}

function emptyCost(): CostBreakdown {
  return { stay: 0, transport: 0, food: 0, activities: 0, total: 0, perPersonApprox: 0, notes: [] };
}
