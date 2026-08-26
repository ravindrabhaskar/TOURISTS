import { db } from "@/server/db";
import { errors } from "@/lib/http";
import type { Prisma, PriceLevel, StayType } from "@prisma/client";

export type StayFilters = {
  q?: string;
  district?: string;
  type?: StayType;
  priceLevel?: PriceLevel;
  maxPrice?: number;
  amenities?: string[];
  sort?: "price_asc" | "price_desc" | "rating";
  page?: number;
  pageSize?: number;
};

const CARD = {
  id: true, slug: true, name: true, type: true, description: true,
  pricePerNightMin: true, pricePerNightMax: true, priceLevel: true,
  ratingAvg: true, ratingCount: true, amenities: true, heroGradient: true,
  verification: true, address: true, lat: true, lng: true,
  district: { select: { name: true, slug: true } },
} satisfies Prisma.StaySelect;

export type StayCard = Prisma.StayGetPayload<{ select: typeof CARD }>;

export async function listStays(f: StayFilters = {}) {
  const page = Math.max(1, f.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, f.pageSize ?? 12));
  const where: Prisma.StayWhereInput = {
    isActive: true,
    ...(f.type ? { type: f.type } : {}),
    ...(f.priceLevel ? { priceLevel: f.priceLevel } : {}),
    ...(f.maxPrice ? { pricePerNightMin: { lte: f.maxPrice } } : {}),
    ...(f.amenities?.length ? { AND: f.amenities.map((a) => ({ amenities: { has: a } })) } : {}),
    ...(f.district ? { district: { OR: [{ slug: f.district }, { code: f.district.toUpperCase() }] } } : {}),
    ...(f.q
      ? {
          OR: [
            { name: { contains: f.q, mode: "insensitive" } },
            { description: { contains: f.q, mode: "insensitive" } },
            { address: { contains: f.q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const orderBy: Prisma.StayOrderByWithRelationInput =
    f.sort === "price_asc" ? { pricePerNightMin: "asc" } : f.sort === "price_desc" ? { pricePerNightMin: "desc" } : { ratingAvg: "desc" };
  const [items, total] = await Promise.all([
    db.stay.findMany({ where, select: CARD, orderBy, skip: (page - 1) * pageSize, take: pageSize }),
    db.stay.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getStayBySlug(slug: string) {
  const s = await db.stay.findUnique({
    where: { slug },
    include: {
      district: { select: { name: true, slug: true } },
      rooms: { orderBy: { basePrice: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { user: { select: { name: true, avatarEmoji: true } } },
      },
    },
  });
  if (!s || !s.isActive) throw errors.notFound("Property not found");
  return s;
}

export async function nearbyStays(lat: number, lng: number, radiusKm = 25, limit = 6): Promise<Array<StayCard & { distanceKm: number }>> {
  const { findNearby } = await import("./destinations");
  void findNearby;
  const latDelta = radiusKm / 111.32;
  const lngDelta = radiusKm / (111.32 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  const rows = await db.$queryRaw<Array<StayCard & { distance_km: number; district: { name: string; slug: string } }>>`
    SELECT s.id, s.slug, s.name, s.type, s.description, s."pricePerNightMin", s."pricePerNightMax",
           s."priceLevel", s."ratingAvg", s."ratingCount", s.amenities, s."heroGradient",
           s.verification, s.address, s.lat, s.lng,
           json_build_object('name', d.name, 'slug', d.slug) AS district,
           (6371 * acos(least(1, greatest(-1,
             sin(radians(${lat})) * sin(radians(s.lat)) +
             cos(radians(${lat})) * cos(radians(s.lat)) * cos(radians(s.lng - ${lng}))
           )))) AS distance_km
    FROM "Stay" s JOIN "District" d ON d.id = s."districtId"
    WHERE s."isActive" = true
      AND s.lat BETWEEN ${lat - latDelta} AND ${lat + latDelta}
      AND s.lng BETWEEN ${lng - lngDelta} AND ${lng + lngDelta}
    ORDER BY distance_km ASC LIMIT ${limit}`;
  return rows.map((r) => ({ ...r, distanceKm: Number(r.distance_km) }));
}

/** Live availability requires an external channel manager/provider.
 * Until configured, room inventory shown is informational — see docs/API.md. */
export function availabilityStatus(): "INFORMATIONAL_ONLY" | "LIVE" {
  return "INFORMATIONAL_ONLY";
}
