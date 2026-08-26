// Pure geospatial helpers. Works on vanilla Postgres (haversine in SQL);
// PostGIS upgrade path documented in infrastructure/postgis-upgrade.sql.

const EARTH_RADIUS_KM = 6371;

export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a)));
}

// Empirical road-distance factor for AP road network (curves, detours).
export const ROAD_FACTOR = 1.28;

export function roadDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return haversineKm(lat1, lng1, lat2, lng2) * ROAD_FACTOR;
}

/** Average effective door-to-door speeds (km/h) by mode on AP roads. */
export const SPEED_BY_MODE: Record<string, number> = {
  CAR: 38,
  BUS: 32,
  TRAIN: 45,
  ANY: 35,
  WALK: 4.5,
};

export function travelMinutes(km: number, mode = "CAR"): number {
  const speed = SPEED_BY_MODE[mode] ?? SPEED_BY_MODE.ANY!;
  return Math.max(5, Math.round((km / speed) * 60));
}

/** Approximate intercity transport cost per person (₹) for planning estimates. */
export function transportCostPerPerson(km: number, mode = "CAR"): number {
  switch (mode) {
    case "BUS":
      return Math.round(km * 2.2);
    case "TRAIN":
      return Math.round(km * 1.6);
    default:
      return Math.round((km * 18) / Math.max(1, 4)); // car fuel+maintenance split across ~4 seats
  }
}

export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}
