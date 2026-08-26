import { db } from "@/server/db";
import { Prisma } from "@prisma/client";

const SEASON_BY_MONTH: Record<number, string[]> = {
  0: ["beaches", "heritage"], 1: ["beaches", "wildlife"], 2: ["waterfalls", "hills"],
  3: ["hills", "coffee"], 4: ["hills", "temples"], 5: ["monsoon", "waterfalls"],
  6: ["monsoon", "waterfalls"], 7: ["monsoon", "nature"], 8: ["festivals", "temples"],
  9: ["festivals", "temples"], 10: ["temples", "culture"], 11: ["beaches", "festivals"],
};

export async function seasonalCategories(month = new Date().getMonth()): Promise<string[]> {
  return SEASON_BY_MONTH[month] ?? ["temples", "beaches"];
}

/** Cold-start safe home recommendations: featured + seasonal + trending. */
export async function homeRecommendations(): Promise<{
  featured: DestinationCardData[];
  seasonal: DestinationCardData[];
  hiddenGems: DestinationCardData[];
}> {
  const month = new Date().getMonth();
  const cats = await seasonalCategories(month);
  const base = {
    where: { status: "PUBLISHED" as const },
    select: CARD_SELECT,
  };
  const [featured, seasonal, hiddenGems] = await Promise.all([
    db.destination.findMany({ ...base, where: { ...base.where, isFeatured: true }, orderBy: { popularityScore: "desc" }, take: 8 }),
    db.destination.findMany({ ...base, where: { ...base.where, categories: { hasSome: cats } }, orderBy: { popularityScore: "desc" }, take: 6 }),
    db.destination.findMany({ ...base, where: { ...base.where, popularityScore: { lte: 45 } }, orderBy: { ratingAvg: "desc" }, take: 6 }),
  ]);
  return { featured, seasonal, hiddenGems };
}

export const CARD_SELECT = {
  id: true, slug: true, name: true, nameTe: true, type: true, summary: true, lat: true, lng: true,
  heroGradient: true, categories: true, tags: true, ratingAvg: true, ratingCount: true,
  popularityScore: true, entryFeeAdult: true, visitDurationMin: true,
  bestTimeToVisit: true, easyAccess: true, familyFriendly: true,
  district: { select: { name: true, slug: true } },
} satisfies Prisma.DestinationSelect;

export type DestinationCardData = Prisma.DestinationGetPayload<{ select: typeof CARD_SELECT }>;

/**
 * Returning-user personalization from explicit interests + behavioural signals
 * (favorites and approved reviews' destination categories). Deterministic and
 * explainable — no black-box scoring at this data volume.
 */
export async function personalizedForUser(userId: string): Promise<DestinationCardData[]> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { interests: true } });
  const favs = await db.favorite.findMany({
    where: { userId, destinationId: { not: null } },
    select: { destination: { select: { id: true, categories: true, districtId: true } } },
    take: 20,
  });
  const reviewed = await db.review.findMany({
    where: { userId, status: "APPROVED", destinationId: { not: null }, rating: { gte: 4 } },
    select: { destination: { select: { id: true, categories: true, districtId: true } } },
    take: 20,
  });

  const catWeights = new Map<string, number>();
  const bump = (cats: string[], w: number) => cats.forEach((c) => catWeights.set(c, (catWeights.get(c) ?? 0) + w));
  for (const c of user?.interests ?? []) bump([c], 2);
  favs.forEach((f) => bump(f.destination?.categories ?? [], 3));
  reviewed.forEach((r) => bump(r.destination?.categories ?? [], 2));

  const excludeIds = new Set(
    [...favs.map((f) => f.destination?.id), ...reviewed.map((r) => r.destination?.id)].filter(Boolean) as string[],
  );

  if (catWeights.size === 0) return [];
  const topCats = [...catWeights.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([c]) => c);

  const rows = await db.destination.findMany({
    where: { status: "PUBLISHED", id: { notIn: [...excludeIds] }, OR: topCats.map((c) => ({ categories: { has: c } })) },
    orderBy: { popularityScore: "desc" },
    take: 6,
    select: CARD_SELECT,
  });
  return rows;
}

export async function trackEvent(input: {
  name: string;
  userId?: string | null;
  anonymousId?: string | null;
  props?: Record<string, unknown>;
  path?: string | null;
  referrer?: string | null;
}) {
  await db.analyticsEvent.create({
    data: {
      name: input.name.slice(0, 60),
      userId: input.userId ?? null,
      anonymousId: input.anonymousId ?? null,
      props: (input.props ?? undefined) as never,
      path: input.path?.slice(0, 300) ?? null,
      referrer: input.referrer?.slice(0, 300) ?? null,
    },
  });
}
