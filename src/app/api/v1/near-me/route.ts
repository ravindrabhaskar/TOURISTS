import { errors, handle, ok } from "@/lib/http";
import { guardRate } from "@/lib/rate-limit";
import { findNearby } from "@/server/domains/destinations";
import { nearbyStays } from "@/server/domains/stays";

export async function GET(req: Request) {
  return handle(async () => {
    guardRate(req, "api:near-me", 60, 60);
    const p = new URL(req.url).searchParams;
    const lat = Number(p.get("lat"));
    const lng = Number(p.get("lng"));
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw errors.badRequest("lat and lng are required numbers.");
    const radiusKm = Number(p.get("radiusKm") ?? 25);
    const [places, stays] = await Promise.all([
      findNearby({ lat, lng, radiusKm, limit: 15 }),
      nearbyStays(lat, lng, radiusKm, 5).catch(() => []),
    ]);
    return ok({
      origin: { lat, lng },
      places: places.map((x) => ({
        name: x.name, slug: x.slug, type: x.type, categories: x.categories.slice(0, 3),
        distanceKm: Math.round(x.distanceKm * 10) / 10, ratingAvg: x.ratingAvg,
        entryFeeAdult: x.entryFeeAdult, href: `/destinations/${x.slug}`,
      })),
      stays: stays.map((s) => ({ name: s.name, slug: s.slug, href: `/stays/${s.slug}`, distanceKm: Math.round(s.distanceKm * 10) / 10 })),
      note: "Distances are straight-line; road travel typically ~1.28×.",
    });
  });
}
