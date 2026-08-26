import { describe, expect, it } from "vitest";
import { formatKm, haversineKm, roadDistanceKm, transportCostPerPerson, travelMinutes } from "./geo";

// Tirupati → Visakhapatnam great-circle distance is ~605 km (state end to end).
const TIRUPATI = { lat: 13.6288, lng: 79.4192 };
const VISAKHAPATNAM = { lat: 17.6868, lng: 83.2185 };

describe("haversineKm", () => {
  it("returns zero for identical points", () => {
    expect(haversineKm(TIRUPATI.lat, TIRUPATI.lng, TIRUPATI.lat, TIRUPATI.lng)).toBe(0);
  });

  it("is symmetric and roughly correct for intra-state hops", () => {
    const ab = haversineKm(TIRUPATI.lat, TIRUPATI.lng, VISAKHAPATNAM.lat, VISAKHAPATNAM.lng);
    const ba = haversineKm(VISAKHAPATNAM.lat, VISAKHAPATNAM.lng, TIRUPATI.lat, TIRUPATI.lng);
    expect(ab).toBeCloseTo(ba, 6);
    expect(ab).toBeGreaterThan(550);
    expect(ab).toBeLessThan(650);
  });
});

describe("roadDistanceKm", () => {
  it("applies the AP road factor over the crow-flies distance", () => {
    const straight = haversineKm(TIRUPATI.lat, TIRUPATI.lng, VISAKHAPATNAM.lat, VISAKHAPATNAM.lng);
    expect(roadDistanceKm(TIRUPATI.lat, TIRUPATI.lng, VISAKHAPATNAM.lat, VISAKHAPATNAM.lng)).toBeCloseTo(straight * 1.28, 6);
  });
});

describe("travelMinutes", () => {
  it("floors short trips at five minutes", () => {
    expect(travelMinutes(0.1)).toBe(5);
  });

  it("uses mode speeds (CAR 38 km/h)", () => {
    expect(travelMinutes(38, "CAR")).toBe(60);
    expect(travelMinutes(32, "BUS")).toBe(60);
  });
});

describe("transportCostPerPerson", () => {
  it("prices bus by distance", () => {
    expect(transportCostPerPerson(100, "BUS")).toBe(220);
  });

  it("splits car running cost across seats", () => {
    expect(transportCostPerPerson(100, "CAR")).toBe(450);
  });
});

describe("formatKm", () => {
  it("switches between metres and kilometres", () => {
    expect(formatKm(0.4)).toBe("400 m");
    expect(formatKm(1.25)).toBe("1.3 km");
  });
});
