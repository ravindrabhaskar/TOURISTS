import Link from "next/link";
import { universalSearch } from "@/server/domains/search";
import { DestinationCard } from "@/components/catalog/cards";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

  let results: Awaited<ReturnType<typeof universalSearch>> = [];
  let failed = false;
  if (q.length >= 2) {
    try {
      results = await universalSearch(q, 20);
    } catch {
      failed = true;
    }
  }

  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader
        eyebrow="Find anything"
        title="Search"
        sub="One box for curated trips, destinations, events, stays and districts."
      />

      <form action="/search" method="get" className="mb-8 mt-8 flex gap-3">
        <input
          name="q"
          defaultValue={q}
          autoFocus
          placeholder="Try “Araku”, “festival”, “beach resort”…"
          className="min-w-0 flex-1 rounded-xl border border-sand-200 bg-surface px-4 py-3 text-base focus:border-brand-400"
          aria-label="Search everything"
        />
        <button type="submit" className="rounded-xl bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700">
          Search
        </button>
      </form>

      {failed ? (
        <p role="alert" className="rounded-xl bg-spice-50 p-4 text-spice-700">Search is temporarily unavailable.</p>
      ) : q.length >= 2 ? (
        results.length > 0 ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {results.map((hit) => {
              if (hit.kind === "destination")
                return (
                  <DestinationCard
                    key={`${hit.kind}-${hit.id}`}
                    d={{ slug: hit.slug, name: hit.title, type: hit.meta ?? "", summary: hit.subtitle ?? "", ratingAvg: 0, entryFeeAdult: null }}
                  />
                );
              return (
                <Link key={`${hit.kind}-${hit.id}`} href={hit.href} className="group block">
                  <article className="h-full rounded-2xl border border-sand-200 bg-surface p-5 shadow-card transition-shadow group-hover:shadow-lift">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-brand-700">{hit.kind}</p>
                    <h2 className="mt-1 font-semibold group-hover:text-brand-700">{hit.title}</h2>
                    {hit.subtitle ? <p className="mt-1 line-clamp-2 text-sm text-ink-900/70">{hit.subtitle}</p> : null}
                  </article>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
            Nothing found for “{q}”. Try a shorter or different term.
          </p>
        )
      ) : (
        <p className="text-center text-ink-900/60">Type at least two characters to search.</p>
      )}
    </div>
  );
}
