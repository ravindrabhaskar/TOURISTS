import { describe, expect, it } from "vitest";
import type { CandidatePoi } from "./types";
import { DAY_START, orderStops, scheduleDay } from "./schedule";

export function makePoi(overrides: Partial<CandidatePoi> = {}): CandidatePoi {
  return {
    id: "poi-1",
    slug: "poi-1",
    name: "Sample Temple",
    type: "TEMPLE",
    districtId: "d-tirupati",
    districtName: "Tirupati",
    lat: 13.6288,
    lng: 79.4192,
    summary: "A serene hill temple.",
    visitDurationMin: 90,
    entryFeeAdult: null,
    ratingAvg: 4.5,
    popularityScore: 70,
    categories: ["temples"],
    tags: ["heritage"],
    easyAccess: true,
    weatherSensitive: false,
    openingHours: null,
    ...overrides,
  };
}

describe("orderStops", () => {
  it("visits the nearest stop first (greedy)", () => {
    const near = makePoi({ id: "a", slug: "a", name: "Near", lat: 13.63, lng: 79.42 });
    const far = makePoi({ id: "b", slug: "b", name: "Far", lat: 17.68, lng: 83.21 });
    const ordered = orderStops([far, near], 13.6288, 79.4192);
    expect(ordered[0]!.id).toBe("a");
    expect(ordered[1]!.id).toBe("b");
  });
});

describe("scheduleDay", () => {
  const base = { pace: "BALANCED" as const, mealCost: 350 };

  it("always schedules breakfast, lunch and dinner around attractions", () => {
    const { items } = scheduleDay({ ...base, startMin: DAY_START.BALANCED, stops: [{ stop: makePoi(), durationMin: 90 }] });
    const meals = items.filter((i) => i.itemType === "MEAL").map((i) => i.title);
    expect(meals).toContain("Breakfast");
    expect(meals).toContain("Lunch");
    expect(items.some((i) => i.title.startsWith("Dinner"))).toBe(true);
    expect([...items].every((i, idx, arr) => idx === 0 || arr[idx - 1]!.startTimeMin <= i.startTimeMin)).toBe(true);
  });

  it("never starts a stop before its opening window", () => {
    const lateOpener = makePoi({
      name: "Museum",
      openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "13:00", close: "21:00" }],
    });
    const { items, droppedStops } = scheduleDay({ ...base, startMin: DAY_START.BALANCED, stops: [{ stop: lateOpener, durationMin: 90 }] });
    expect(droppedStops).toHaveLength(0);
    const museum = items.find((i) => i.title === "Museum")!;
    expect(museum.startTimeMin).toBeGreaterThanOrEqual(13 * 60);
  });

  it("drops stops whose visiting hours cannot fit, with a reason", () => {
    const earlyCloser = makePoi({
      name: "Dawn Viewpoint",
      openingHours: [{ days: [0, 1, 2, 3, 4, 5, 6], open: "05:00", close: "06:30" }],
    });
    const { items, droppedStops } = scheduleDay({ ...base, startMin: DAY_START.BALANCED, stops: [{ stop: earlyCloser, durationMin: 60 }] });
    expect(items.some((i) => i.title === "Dawn Viewpoint")).toBe(false);
    expect(droppedStops[0]).toMatchObject({ name: "Dawn Viewpoint", why: "Visiting hours do not fit the schedule" });
  });

  it("drops leftovers once the soft day end is reached", () => {
    const stops = Array.from({ length: 6 }, (_, i) => ({
      stop: makePoi({ id: `x${i}`, slug: `x${i}`, name: `Stop ${i}` }),
      durationMin: 120,
    }));
    const { droppedStops } = scheduleDay({ ...base, startMin: DAY_START.BALANCED, stops });
    expect(droppedStops.length).toBeGreaterThan(0);
    expect(droppedStops.every((d) => d.why === "Not enough time left in the day")).toBe(true);
  });
});
