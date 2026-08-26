import { describe, expect, it } from "vitest";
import { addStop, deprioritizeWeatherSensitive, removeItem, shiftDay } from "./modify";
import type { DraftItem } from "./types";
import { makePoi } from "./schedule.test";

function item(overrides: Partial<DraftItem> = {}): DraftItem {
  return {
    itemType: "ATTRACTION",
    title: "Attraction",
    startTimeMin: 10 * 60,
    endTimeMin: 11 * 60,
    travelFromPrevMinutes: 0,
    estimatedCostPerPerson: 0,
    bookingRequired: false,
    weatherSensitive: false,
    ...overrides,
  };
}

describe("removeItem", () => {
  it("removes an unlocked matching item and reports it", () => {
    const items = [item({ title: "Museum visit" }), item({ title: "Beach walk", startTimeMin: 12 * 60 })];
    const res = removeItem(items, "museum");
    expect(res.items.map((i) => i.title)).not.toContain("Museum visit");
    expect(res.notes[0]).toContain("Removed");
    expect(res.warnings).toHaveLength(0);
  });

  it("refuses to silently drop locked items", () => {
    const items = [item({ title: "Tirumala Darshan", locked: true })];
    const res = removeItem(items, "darshan");
    expect(res.items).toHaveLength(1);
    expect(res.warnings[0]).toMatch(/Could not find a removable item/i);
  });
});

describe("shiftDay", () => {
  it("moves unlocked items by the delta while preserving locked times", () => {
    const locked = item({ title: "Darshan slot", locked: true, startTimeMin: 6 * 60, endTimeMin: 7 * 60 });
    const flexible = item({ title: "Beach", startTimeMin: 10 * 60, endTimeMin: 12 * 60 });
    const res = shiftDay([flexible, locked], 45);
    const beach = res.items.find((i) => i.title === "Beach")!;
    expect(beach.startTimeMin).toBeGreaterThan(10 * 60);
    const slot = res.items.find((i) => i.title === "Darshan slot")!;
    expect(slot.startTimeMin).toBe(6 * 60);
    expect(slot.endTimeMin).toBe(7 * 60);
  });
});

describe("deprioritizeWeatherSensitive", () => {
  it("orders outdoor stops after indoor ones", () => {
    const outdoor = item({ title: "Waterfall trek", weatherSensitive: true, startTimeMin: 9 * 60 });
    const indoor = item({ title: "Museum", startTimeMin: 14 * 60 });
    const res = deprioritizeWeatherSensitive([outdoor, indoor]);
    const titles = res.items.map((i) => i.title);
    expect(titles.indexOf("Waterfall trek")).toBeGreaterThan(titles.indexOf("Museum"));
    expect(res.notes.join(" ")).toMatch(/rain/i);
  });
});

describe("addStop", () => {
  it("inserts the requested stop into the day timeline", () => {
    const existing = [item({ title: "Temple", lat: 13.63, lng: 79.42, startTimeMin: 9 * 60, endTimeMin: 10 * 60 })];
    const res = addStop(existing, {
      name: "Local Market",
      lat: 13.65,
      lng: 79.44,
      durationMin: 45,
      costPerPerson: 0,
    });
    const market = res.items.find((i) => i.title === "Local Market");
    expect(market).toBeDefined();
    expect(market!.itemType).toBe("ATTRACTION");
    expect(market!.startTimeMin).toBeGreaterThanOrEqual(9 * 60);
  });

  it("keeps candidate data attached for persistence", () => {
    const poi = makePoi({ id: "poi-9", slug: "poi-9", name: "Cave" });
    const res = addStop([], { id: poi.id, slug: poi.slug, name: poi.name, lat: poi.lat, lng: poi.lng, durationMin: 60, costPerPerson: 25 });
    const cave = res.items.find((i) => i.title === "Cave")!;
    expect(cave.destinationId).toBe(poi.id);
    expect(cave.destinationSlug).toBe(poi.slug);
  });
});
