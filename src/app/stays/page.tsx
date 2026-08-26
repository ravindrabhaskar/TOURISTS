import { listStays } from "@/server/domains/stays";
import { StayCard, Pagination } from "@/components/catalog/cards";
import { SectionHeading } from "@/components/ui/primitives";
import type { PriceLevel, StayType } from "@prisma/client";

export const metadata = {
  title: "Stays",
  description: "Verified hotels, resorts and homestays across Andhra Pradesh.",
};

export default async function StaysPage({ searchParams }: { searchParams: Promise<{ q?: string; district?: string; type?: string; priceLevel?: string; maxPrice?: string; sort?: string; page?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));

  let result: Awaited<ReturnType<typeof listStays>> | null = null;
  try {
    result = await listStays({
      q: sp.q,
      district: sp.district,
      type: (sp.type as StayType) || undefined,
      priceLevel: (sp.priceLevel as PriceLevel) || undefined,
      maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
      sort: (sp.sort as "price_asc" | "price_desc" | "rating") || undefined,
      page,
      pageSize: 12,
    });
  } catch {
    result = null;
  }

  return (
    <div className="container py-10">
      <SectionHeading title="Stays" subtitle="Every property is verified by the tourism team before listing." />

      <div role="note" className="mb-6 rounded-xl bg-sand-100 px-4 py-3 text-sm text-ink-900/75">
        ℹ️ Property details are platform-verified. <strong>Live room availability is not yet connected</strong> — booking flows run in clearly-labelled sandbox mode.
      </div>

      {result && result.items.length > 0 ? (
        <>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.items.map((s) => (
              <StayCard key={s.id} s={s} />
            ))}
          </div>
          <Pagination page={result.page} pageSize={result.pageSize} total={result.total} basePath="/stays" />
        </>
      ) : (
        <p className="rounded-xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">No stays match those filters.</p>
      )}
    </div>
  );
}
