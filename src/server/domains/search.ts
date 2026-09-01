import { db } from "@/server/db";
import { errors } from "@/lib/http";
import { getVisibleTrips } from "@/lib/server/content";

export type UniversalHit = {
  kind: "destination" | "stay" | "event" | "district" | "guide" | "trip";
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  meta?: string;
  href: string;
};

/** Universal search across core catalog. Postgres ILIKE today; SearchService
 * interface is the seam for Typesense/OpenSearch later (docs/API.md). */
export async function universalSearch(qRaw: string, limit = 8): Promise<UniversalHit[]> {
  const q = qRaw.trim();
  if (q.length < 2) return [];

  const needle = q.toLowerCase();

  // Curated trips are editorial content rather than database rows, so they are
  // matched in-process and folded into the same result set.
  const tripHits = await getVisibleTrips()
    .then((trips) =>
      trips
        .filter((t) =>
          [t.name, t.blurb, t.region, t.country, ...t.tags, ...t.startCities]
            .join(" ")
            .toLowerCase()
            .includes(needle),
        )
        .slice(0, limit)
        .map((t) => ({
          kind: "trip" as const,
          id: t.slug,
          slug: t.slug,
          title: t.name,
          subtitle: t.blurb,
          meta: `${t.region} · ${t.days} days`,
          href: `/trips/${t.slug}`,
        })),
    )
    .catch(() => [] as UniversalHit[]);

  const [dests, stays, events, districts, guides] = await Promise.all([
    db.destination.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { summary: { contains: q, mode: "insensitive" } },
          { tags: { has: q.toLowerCase() } },
          { categories: { has: q.toLowerCase() } },
        ],
      },
      select: { id: true, slug: true, name: true, summary: true, type: true, district: { select: { name: true } } },
      orderBy: { popularityScore: "desc" },
      take: limit,
    }),
    db.stay.findMany({
      where: { isActive: true, verification: "VERIFIED", name: { contains: q, mode: "insensitive" } },
      select: { id: true, slug: true, name: true, type: true, district: { select: { name: true } } },
      take: limit,
    }),
    db.event.findMany({
      where: {
        status: "PUBLISHED",
        endDate: { gte: new Date() },
        OR: [{ title: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }],
      },
      select: { id: true, slug: true, title: true, startDate: true, district: { select: { name: true } } },
      orderBy: { startDate: "asc" },
      take: limit,
    }),
    db.district.findMany({
      where: { OR: [{ name: { contains: q, mode: "insensitive" } }, { headquarters: { contains: q, mode: "insensitive" } }] },
      select: { id: true, slug: true, name: true, region: true },
      take: 4,
    }),
    db.contentPage.findMany({
      where: { status: "PUBLISHED", OR: [{ title: { contains: q, mode: "insensitive" } }, { excerpt: { contains: q, mode: "insensitive" } }] },
      select: { id: true, slug: true, title: true, excerpt: true },
      take: 4,
    }),
  ]);

  const hits: UniversalHit[] = [
    ...tripHits,
    ...dests.map((d) => ({ kind: "destination" as const, id: d.id, slug: d.slug, title: d.name, subtitle: d.summary, meta: d.district.name, href: `/destinations/${d.slug}` })),
    ...events.map((e) => ({ kind: "event" as const, id: e.id, slug: e.slug, title: e.title, meta: `${e.district.name} · ${new Date(e.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`, href: `/events/${e.slug}` })),
    ...stays.map((s) => ({ kind: "stay" as const, id: s.id, slug: s.slug, title: s.name, meta: `${s.type.charAt(0)}${s.type.slice(1).toLowerCase()} · ${s.district.name}`, href: `/stays/${s.slug}` })),
    ...districts.map((d) => ({ kind: "district" as const, id: d.id, slug: d.slug, title: d.name, subtitle: `${d.region} region`, meta: "District", href: `/districts/${d.slug}` })),
    ...guides.map((g) => ({ kind: "guide" as const, id: g.id, slug: g.slug, title: g.title, subtitle: g.excerpt, meta: "Travel guide", href: `/travel-guides/${g.slug}` })),
  ];
  return hits;
}

export async function logSearch(userId: string | null, query: string, resultCount: number) {
  if (!query.trim()) return;
  await db.searchLog.create({ data: { userId: userId ?? null, query: query.trim().slice(0, 200), resultCount } });
}

export async function popularSearches(limit = 8): Promise<string[]> {
  const rows = await db.$queryRaw<Array<{ query: string; n: bigint }>>`
    SELECT LOWER(query) AS query, COUNT(*) AS n FROM "SearchLog"
    WHERE LENGTH(query) > 2 AND created_at > now() - interval '30 days'
    GROUP BY LOWER(query) ORDER BY n DESC LIMIT ${limit}`;
  return rows.map((r) => r.query);
}

export async function assertSearchable() {
  // cheap liveness probe used by /api/v1/search
  await db.$queryRaw`SELECT 1`;
  return true;
}

export const searchErrors = errors;
