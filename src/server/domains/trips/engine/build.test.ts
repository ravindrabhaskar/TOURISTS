import { describe, expect, it } from "vitest";
import type { CandidatePoi, PlannerInput } from "./types";
import { MAX_STOPS_PER_DAY, buildDraft, scoreCandidate } from "./build";
import { makePoi } from "./schedule.test";

const input: PlannerInput = {
  originName: "Hyderabad",
  originLat: 17.385,
  originLng: 78.4867,
  startDate: new Date("2026-10-10T04:30:00Z"),
  days: 2,
  adults: 2,
  children: 0,
  seniors: 0,
  interests: ["temples", "beaches"],
  pace: "BALANCED",
  accessibilityNeeds: [],
};

const TIRUPATI_POIS: CandidatePoi[] = [
  makePoi({ id: "t1", slug: "t1", name: "Hill Temple", popularityScore: 90, ratingAvg: 4.8 }),
  makePoi({ id: "t2", slug: "t2", name: "City Temple", lat: 13.65, lng: 79.44 }),
];
const BEACH_POIS: CandidatePoi[] = [
  makePoi({
    id: "b1",
    slug: "b1",
    name: "Long Beach",
    districtId: "d-guntur",
    districtName: "Guntur",
    type: "BEACH",
    categories: ["beaches"],
    weatherSensitive: true,
    lat: 15.9,
    lng: 80.45,
  }),
];

describe("scoreCandidate", () => {
  it("rewards interest matches and easy access", () => {
    const base = scoreCandidate(makePoi({ categories: ["museums"], tags: [] }), input);
    const matched = scoreCandidate(makePoi({ categories: ["temples"], tags: ["heritage"] }), input);
    expect(matched).toBeGreaterThan(base);
    const seniorInput = { ...input, seniors: 2 };
    expect(scoreCandidate(makePoi(), seniorInput)).toBeGreaterThan(scoreCandidate(makePoi(), input));
  });
});

describe("buildDraft", () => {
  it("produces one day plan per requested day with meals and cost estimate", () => {
    const draft = buildDraft(input, [...TIRUPATI_POIS, ...BEACH_POIS]);
    expect(draft.days).toHaveLength(2);
    for (const day of draft.days) {
      expect(day.items.some((i) => i.itemType === "MEAL")).toBe(true);
      expect(day.clusterName).toBeTruthy();
    }
    expect(draft.cost.total).toBeGreaterThan(0);
    expect(draft.cost.perPersonApprox).toBeGreaterThan(0);
    expect(draft.explanation.length).toBeGreaterThanOrEqual(2);
  });

  it("respects the pace cap on attractions per day", () => {
    const packed = { ...input, pace: "PACKED" as const, days: 1 };
    const fiveStops = Array.from({ length: 5 }, (_, i) =>
      makePoi({ id: `s${i}`, slug: `s${i}`, name: `Stop ${i}`, lat: 13.63 + i * 0.01, lng: 79.42 + i * 0.01 }),
    );
    const draft = buildDraft(packed, fiveStops);
    const attractions = draft.days[0]!.items.filter((i) => i.itemType === "ATTRACTION");
    expect(attractions.length).toBeLessThanOrEqual(MAX_STOPS_PER_DAY.PACKED);
  });

  it("hard-filters to accessible places for wheelchair users when possible", () => {
    const wheelchair = { ...input, accessibilityNeeds: ["wheelchair"] };
    const mixed = [...TIRUPATI_POIS, makePoi({ id: "x", slug: "x", name: "Inaccessible Spot", easyAccess: false })];
    const draft = buildDraft(wheelchair, mixed);
    const chosenIds = draft.days.flatMap((d) => d.items.map((i) => i.destinationId));
    expect(chosenIds).not.toContain("x");
  });

  it("boosts must-visit places into the first day", () => {
    const focused = { ...input, days: 1, preferredSlugs: ["b1"] };
    const draft = buildDraft(focused, [...TIRUPATI_POIS, ...BEACH_POIS]);
    expect(draft.days[0]!.clusterName).toBe("Guntur");
    expect(draft.days[0]!.items.some((i) => i.title === "Long Beach")).toBe(true);
  });

  it("explains itself honestly when nothing matches", () => {
    const draft = buildDraft(input, []);
    expect(draft.days).toHaveLength(0);
    expect(draft.explanation[0]).toMatch(/no matching places/i);
    expect(draft.cost.total).toBe(0);
  });

  it("flags budget overruns instead of hiding them", () => {
    const tight = { ...input, budgetTotal: 1000, days: 2 };
    const draft = buildDraft(tight, [...TIRUPATI_POIS, ...BEACH_POIS]);
    expect(draft.cost.total).toBeGreaterThan(tight.budgetTotal);
    expect(draft.cost.notes.length).toBeGreaterThan(0);
  });
});
