import { listEvents } from "@/server/domains/events";
import { EventCard, Pagination } from "@/components/catalog/cards";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Events & Festivals",
  description: "Festivals, fairs, cultural and religious events across Andhra Pradesh.",
};

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ when?: string; category?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  let result: Awaited<ReturnType<typeof listEvents>> | null = null;
  try {
    result = await listEvents({
      when: (sp.when as "upcoming" | "this-month" | "all") || "upcoming",
      category: sp.category?.toUpperCase(),
      page,
      pageSize: 12,
    });
  } catch {
    result = null;
  }

  const qs = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) if (v) params.set(k, String(v));
    return `/events?${params.toString()}`;
  };

  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader
        eyebrow="What's on"
        title="Festivals & events"
        sub="Andhra's living cultural calendar — plan your trip around it."
      />

      <div className="mb-8 mt-8 flex flex-wrap gap-2">
        {[
          ["upcoming", "Upcoming"],
          ["this-month", "This month"],
          ["all", "All"],
        ].map(([value, label]) => (
          <a
            key={value}
            href={qs({ when: value, page: undefined })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium ${
              (sp.when ?? "upcoming") === value ? "border-brand-600 bg-brand-600 text-white" : "border-sand-200 bg-surface text-ink-900/70 hover:border-brand-300"
            }`}
          >
            {label}
          </a>
        ))}
        <span aria-hidden className="mx-2 w-px self-stretch bg-sand-200" />
        {["FESTIVAL", "RELIGIOUS", "CULTURAL", "FAIR", "SPORTS", "MUSIC_DANCE"].map((c) => (
          <a
            key={c}
            href={qs({ category: sp.category === c ? undefined : c, page: undefined })}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium capitalize ${
              sp.category === c ? "border-spice-500 bg-spice-500 text-white" : "border-sand-200 bg-surface text-ink-900/70 hover:border-brand-300"
            }`}
          >
            {c.toLowerCase().replace(/_/g, " ")}
          </a>
        ))}
      </div>

      {result && result.items.length > 0 ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {result.items.map((e) => (
              <EventCard key={e.id} e={e} />
            ))}
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/events" />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          No upcoming events match this filter.
        </p>
      )}
    </div>
  );
}
