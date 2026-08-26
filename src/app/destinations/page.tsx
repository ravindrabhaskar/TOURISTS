import Link from "next/link";
import { db } from "@/server/db";
import { listDestinations } from "@/server/domains/destinations";
import { DestinationCard, Pagination } from "@/components/catalog/cards";
import { SectionHeading } from "@/components/ui/primitives";
import type { DestinationType } from "@prisma/client";

export const metadata = {
  title: "Destinations",
  description: "Browse verified destinations across Andhra Pradesh — temples, beaches, hill stations, caves and more.",
};

const TYPE_FILTERS: Array<{ value: string; label: string }> = [
  { value: "", label: "All" },
  { value: "TEMPLE", label: "Temples" },
  { value: "BEACH", label: "Beaches" },
  { value: "HILL_STATION", label: "Hill stations" },
  { value: "WATERFALL", label: "Waterfalls" },
  { value: "HERITAGE_SITE", label: "Heritage" },
  { value: "CAVE", label: "Caves" },
  { value: "FORT", label: "Forts" },
  { value: "WILDLIFE_SANCTUARY", label: "Wildlife" },
  { value: "VIEWPOINT", label: "Viewpoints" },
];

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; district?: string; type?: string; category?: string; sort?: string; page?: string; easyAccess?: string; familyFriendly?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  let districts: Array<{ id: string; name: string; slug: string }> = [];
  try {
    districts = await db.district.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } });
  } catch {
    districts = [];
  }

  let result: Awaited<ReturnType<typeof listDestinations>> | null = null;
  let failed = false;
  try {
    result = await listDestinations({
      q: sp.q,
      district: sp.district,
      type: (sp.type as DestinationType) || undefined,
      category: sp.category,
      easyAccess: sp.easyAccess === "true",
      familyFriendly: sp.familyFriendly === "true",
      sort: (sp.sort as "popularity" | "rating" | "name") || "popularity",
      page,
      pageSize: 12,
    });
  } catch {
    failed = true;
  }

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) if (v) params.set(k, String(v));
    return `/destinations?${params.toString()}`;
  };

  return (
    <div className="container py-10">
      <SectionHeading
        title="Discover Andhra Pradesh"
        subtitle={result ? `${result.total} verified places · updated by the tourism team` : "Verified places across all 26 districts"}
      />

      <form action="/destinations" method="get" className="mb-8 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search places… e.g. Araku, waterfall, Tirupati"
          className="min-w-0 flex-1 rounded-xl border border-sand-200 bg-white px-4 py-2.5 focus:border-brand-400 sm:max-w-md"
          aria-label="Search destinations"
        />
        <select name="district" defaultValue={sp.district ?? ""} aria-label="District filter" className="rounded-xl border border-sand-200 bg-white px-3 py-2.5">
          <option value="">All districts</option>
          {districts.map((d) => (
            <option key={d.id} value={d.slug}>{d.name}</option>
          ))}
        </select>
        <input type="hidden" name="type" value={sp.type ?? ""} />
        <input type="hidden" name="sort" value={sp.sort ?? ""} />
        <button type="submit" className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Type filters">
        {TYPE_FILTERS.map((t) => (
          <Link
            key={t.value}
            href={qs({ type: t.value || undefined, page: undefined })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              (sp.type ?? "") === t.value ? "border-brand-600 bg-brand-600 text-white" : "border-sand-200 bg-white text-ink-900/70 hover:border-brand-300"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-ink-900/60">Sort:</span>
        {[
          ["popularity", "Popular"],
          ["rating", "Top rated"],
          ["name", "A–Z"],
        ].map(([value, label]) => (
          <Link
            key={value}
            href={qs({ sort: value, page: undefined })}
            className={`rounded-lg px-2.5 py-1 font-medium ${(sp.sort ?? "popularity") === value ? "bg-brand-50 text-brand-800" : "text-ink-900/60 hover:text-brand-700"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {failed ? (
        <p role="alert" className="rounded-xl bg-spice-50 p-4 text-spice-700">The catalog is temporarily unavailable — please refresh.</p>
      ) : result && result.items.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((d) => (
              <DestinationCard key={d.id} d={d} />
            ))}
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/destinations" />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          No places match those filters yet. Try clearing the search.
        </p>
      )}
    </div>
  );
}
