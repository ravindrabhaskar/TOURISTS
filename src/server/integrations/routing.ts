import { roadDistanceKm, travelMinutes } from "@/lib/geo";
import { logger } from "@/lib/logger";

export type RouteLeg = {
  distanceKm: number;
  durationMin: number;
  source: "osrm" | "estimate";
};

/**
 * Routing abstraction. OSRM public demo used when reachable (no key needed),
 * with deterministic haversine-based estimation as the always-available fallback.
 * A commercial provider (Google/MapmyIndia) plugs in behind this same interface —
 * see docs/INTEGRATIONS (docs/ARCHITECTURE.md).
 */
export async function routeBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
  opts: { mode?: "driving" | "walking"; timeoutMs?: number } = {},
): Promise<RouteLeg> {
  const mode = opts.mode ?? "driving";
  const fallback: RouteLeg = {
    distanceKm: Number(roadDistanceKm(a.lat, a.lng, b.lat, b.lng).toFixed(1)),
    durationMin: travelMinutes(roadDistanceKm(a.lat, a.lng, b.lat, b.lng), mode === "walking" ? "WALK" : "CAR"),
    source: "estimate",
  };
  if (process.env.ROUTING_PROVIDER !== "osrm") return fallback;
  try {
    const url = `https://router.project-osrm.org/route/v1/${mode}/${a.lng},${a.lat};${b.lng},${b.lat}?overview=false`;
    const res = await fetch(url, { signal: AbortSignal.timeout(opts.timeoutMs ?? 4000) });
    if (!res.ok) throw new Error(`osrm ${res.status}`);
    const j = (await res.json()) as { routes?: Array<{ distance: number; duration: number }> };
    const r = j.routes?.[0];
    if (!r) throw new Error("no route");
    return { distanceKm: Number((r.distance / 1000).toFixed(1)), durationMin: Math.max(3, Math.round(r.duration / 60)), source: "osrm" };
  } catch (e) {
    logger.debug("routing.fallback_estimate", { error: String(e) });
    return fallback;
  }
}
