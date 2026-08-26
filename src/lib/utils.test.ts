import { describe, expect, it } from "vitest";
import { bookingReference, formatINR, minutesToTime, slugify } from "./utils";

describe("minutesToTime", () => {
  it("formats minutes since midnight", () => {
    expect(minutesToTime(0)).toBe("00:00");
    expect(minutesToTime(8 * 60 + 30)).toBe("08:30");
  });

  it("wraps values beyond a day or negative", () => {
    expect(minutesToTime(1440 + 90)).toBe("01:30");
    expect(minutesToTime(-30)).toBe("23:30");
  });
});

describe("slugify", () => {
  it("produces clean url slugs", () => {
    expect(slugify("Araku Valley Coffee Museum")).toBe("araku-valley-coffee-museum");
    expect(slugify("Sri Venkateswara Temple (Tirumala)")).toBe("sri-venkateswara-temple-tirumala");
    expect(slugify("  multiple   dashes --here  ")).toBe("multiple-dashes-here");
  });
});

describe("formatINR", () => {
  it("formats rupees with Indian grouping", () => {
    expect(formatINR(125000)).toMatch(/1,25,000/);
  });

  it("renders missing amounts as a dash", () => {
    expect(formatINR(null)).toBe("—");
    expect(formatINR(undefined)).toBe("—");
  });
});

describe("bookingReference", () => {
  it("uses the SAN- prefix and an unambiguous alphabet", () => {
    const ref = bookingReference();
    expect(ref).toMatch(/^SAN-[A-HJ-NP-Z2-9]{8}$/);
  });
});
