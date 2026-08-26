import { describe, expect, it } from "vitest";
import { fitsVisit, isOpenAt, isUnknownHours, todayWindowsLabel, type OpeningHours } from "./opening-hours";

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const dayHours: OpeningHours = [{ days: ALL_DAYS, open: "09:00", close: "17:00" }];
const overnight: OpeningHours = [{ days: ALL_DAYS, open: "22:00", close: "02:00" }];

describe("isOpenAt", () => {
  it("treats unknown hours as open", () => {
    expect(isOpenAt(null, new Date())).toBe(true);
    expect(isOpenAt(undefined, new Date())).toBe(true);
    expect(isOpenAt([], new Date())).toBe(true);
  });

  it("is open inside a window and closed outside", () => {
    const at10 = new Date(2026, 0, 5, 10, 0); // Monday
    const at20 = new Date(2026, 0, 5, 20, 0);
    expect(isOpenAt(dayHours, at10)).toBe(true);
    expect(isOpenAt(dayHours, at20)).toBe(false);
  });

  it("honours weekday restrictions", () => {
    const mondayOnly: OpeningHours = [{ days: [1], open: "09:00", close: "17:00" }];
    expect(isOpenAt(mondayOnly, new Date(2026, 0, 5, 12, 0))).toBe(true); // Mon
    expect(isOpenAt(mondayOnly, new Date(2026, 0, 6, 12, 0))).toBe(false); // Tue
  });

  it("supports windows spanning midnight", () => {
    expect(isOpenAt(overnight, new Date(2026, 0, 5, 23, 0))).toBe(true);
    expect(isOpenAt(overnight, new Date(2026, 0, 6, 1, 0))).toBe(true);
    expect(isOpenAt(overnight, new Date(2026, 0, 6, 12, 0))).toBe(false);
  });
});

describe("fitsVisit", () => {
  it("accepts a visit fully inside an open window", () => {
    const arrival = new Date(2026, 0, 5, 10, 0);
    expect(fitsVisit(dayHours, arrival, 120)).toBe(true);
  });

  it("rejects a visit that overruns closing time", () => {
    const arrival = new Date(2026, 0, 5, 16, 0);
    expect(fitsVisit(dayHours, arrival, 120)).toBe(false);
  });

  it("accepts anything when hours are unknown", () => {
    expect(fitsVisit(null, new Date(), 600)).toBe(true);
  });
});

describe("todayWindowsLabel", () => {
  it("explains unpublished timings", () => {
    expect(todayWindowsLabel(null)).toBe("Timings not published");
    expect(isUnknownHours([])).toBe(true);
  });

  it("reports closed days and formats windows", () => {
    const tue = new Date(2026, 0, 6);
    expect(todayWindowsLabel([{ days: [1], open: "06:00", close: "12:00" }], tue)).toBe("Closed today");
    const mon = new Date(2026, 0, 5);
    const twoWindows: OpeningHours = [
      { days: [1], open: "06:00", close: "11:00" },
      { days: [1], open: "16:00", close: "20:30" },
    ];
    expect(todayWindowsLabel(twoWindows, mon)).toBe("06:00 – 11:00, 16:00 – 20:30");
  });
});
