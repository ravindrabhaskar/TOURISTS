import { db } from "@/server/db";
import { Prisma, type DestinationType } from "@prisma/client";
import { errors } from "@/lib/http";
import { roadDistanceKm, travelMinutes } from "@/lib/geo";

export type DestinationListFilters = {
  q?: string;
  district?: string; // slug or code
  type?: DestinationType;
  category?: string;
  easyAccess?: boolean;
  familyFriendly?: boolean;
  featured?: boolean;
  maxEntryFee?: number;
  sort?: "popularity" | "rating" | "name";
  page?: number;
  pageSize?: number;
};

const LIST_SELECT = {
  id: true, slug: true, name: true, nameTe: true, type: true, summary: true,
  lat: true, lng: true, heroGradient: true, images: true, categories: true, tags: true,
  ratingAvg: true, ratingCount: true, popularityScore: true, entryFeeAdult: true,
  visitDurationMin: true, bestTimeToVisit: true, easyAccess: true, familyFriendly: true,
  district: { select: { name: true, slug: true } },
} satisfies Prisma.DestinationSelect;

export type DestinationCard = Prisma.DestinationGetPayload<{ select: typeof LIST_SELECT }>;

export async function listDestinations(
  f: DestinationListFilters,
): Promise<{ items: DestinationCard[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, f.pageSize ?? 12));
  const where: Prisma.DestinationWhereInput = {
    status: "PUBLISHED",
    ...(f.type ? { type: f.type } : {}),
    ...(f.featured ? { isFeatured: true } : {}),
    ...(f.easyAccess ? { easyAccess: true } : {}),
    ...(f.familyFriendly !== undefined ? { familyFriendly: f.familyFriendly } : {}),
    ...(f.maxEntryFee !== undefined ? { OR: [{ entryFeeAdult: null }, { entryFeeAdult: { lte: f.maxEntryFee } }] } : {}),
    ...(f.district
      ? { district: { OR: [{ slug: f.district }, { code: f.district.toUpperCase() }] } }
      : {}),
    ...(f.category ? { categories: { has: f.category } } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { summary: { contains: f.q, mode: "insensitive" } },
            { tags: { has: f.q.toLowerCase() } },
            { district: { name: { contains: f.q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const orderBy: Prisma.DestinationOrderByWithRelationInput =
    f.sort === "rating" ? { ratingAvg: "desc" } : f.sort === "name" ? { name: "asc" } : { popularityScore: "desc" };

  const [items, total] = await Promise.all([
    db.destination.findMany({ where, select: LIST_SELECT, orderBy: [orderBy, { name: "asc" }], skip: (page - 1) * pageSize, take: pageSize }),
    db.destination.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getDestinationBySlug(slug: string) {
  const d = await db.destination.findUnique({
    where: { slug },
    include: {
      district: { select: { name: true, slug: true, region: true } },
      parent: { select: { name: true, slug: true } },
      events: { where: { status: "PUBLISHED", endDate: { gte: new Date() } }, orderBy: { startDate: "asc" }, take: 3 },
    },
  });
  if (!d || d.status !== "PUBLISHED") throw errors.notFound("Destination not found");
  return d;
}

export async function getRelated(destId: string, districtId: string, limit = 4) {
  const same = await db.destination.findMany({
    where: { id: { not: destId }, districtId, status: "PUBLISHED" },
    select: LIST_SELECT,
    orderBy: { popularityScore: "desc" },
    take: limit,
  });
  if (same.length >= limit) return same;
  const fill = await db.destination.findMany({
    where: { id: { notIn: [destId, ...same.map((s) => s.id)] }, status: "PUBLISHED", popularityScore: { gte: 0 } },
    select: LIST_SELECT,
    orderBy: { popularityScore: "desc" },
    take: limit - same.length,
  });
  return [...same, ...fill];
}

export type NearbyPlace = DestinationCard & { distanceKm: number };

/** Haversine proximity search (raw SQL for index-friendly bounding prefilter). */
export async function findNearby(opts: {
  lat: number;
  lng: number;
  radiusKm?: number;
  types?: DestinationType[];
  category?: string;
  limit?: number;
}): Promise<NearbyPlace[]> {
  const radius = Math.min(200, Math.max(0.5, opts.radiusKm ?? 10));
  const limit = Math.min(50, Math.max(1, opts.limit ?? 20));
  // Bounding-box prefilter lets Postgres use the (lat,lng) index before exact math.
  const latDelta = radius / 111.32;
  const lngDelta = radius / (111.32 * Math.max(0.2, Math.cos((opts.lat * Math.PI) / 180)));
  const rows = await db.$queryRaw<Array<DestinationCard & { distance_km: number }>>`
    SELECT d.id, d.slug, d.name, d."nameTe", d.type, d.summary, d.lat, d.lng,
           d."heroGradient", d.categories, d.tags, d."ratingAvg", d."ratingCount",
           d."popularityScore", d."entryFeeAdult", d."visitDurationMin",
           d."bestTimeToVisit", d."easyAccess", d."familyFriendly",
           json_build_object('name', x.name, 'slug', x.slug) AS district,
           haversine_km(d.lat, d.lng, ${opts.lat}, ${opts.lng}) AS distance_km
    FROM "Destination" d JOIN "District" x ON x.id = d."districtId"
    WHERE d.status = 'PUBLISHED'
      AND d.lat BETWEEN ${opts.lat - latDelta} AND ${opts.lat + latDelta}
      AND d.lng BETWEEN ${opts.lng - lngDelta} AND ${opts.lng + lngDelta}
    ORDER BY distance_km ASC LIMIT ${limit * 3}`;

  let places = rows.map((r) => ({ ...r, distanceKm: Number(r.distance_km) }));
  if (opts.types?.length) places = places.filter((p) => opts.types!.includes(p.type));
  if (opts.category) places = places.filter((p) => p.categories.includes(opts.category!));
  places.sort((a, b) => a.distanceKm - b.distanceKm);
  return places.slice(0, limit);
}

export async function travelBetween(aLat: number, aLng: number, bLat: number, bLng: number, mode = "CAR") {
  const km = roadDistanceKm(aLat, aLng, bLat, bLng);
  return { km, minutes: travelMinutes(km, mode) };
}

export async function featuredDestinations(limit = 8): Promise<DestinationCard[]> {
  return db.destination.findMany({
    where: { status: "PUBLISHED", isFeatured: true },
    select: LIST_SELECT,
    orderBy: { popularityScore: "desc" },
    take: limit,
  });
}

export async function popularByCategory(category: string, limit = 6): Promise<DestinationCard[]> {
  return db.destination.findMany({
    where: { status: "PUBLISHED", categories: { has: category } },
    select: LIST_SELECT,
    orderBy: { popularityScore: "desc" },
    take: limit,
  });
}

export async function listDistricts() {
  return db.district.findMany({
    orderBy: [{ region: "asc" }, { name: "asc" }],
    include: { _count: { select: { destinations: { where: { status: "PUBLISHED" } } } } },
  });
}
