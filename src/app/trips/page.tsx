import type { Metadata } from "next";
import { Suspense } from "react";
import TripsExplorer from "@/components/trips/TripsExplorer";
import { getVisibleTrips } from "@/lib/server/content";

export const metadata: Metadata = {
  title: "All trips",
  description:
    "Browse thirty-two small-group trips by month, region, budget and interest — with honest season data on every card.",
};

export const dynamic = "force-dynamic";

export default async function TripsPage() {
  const trips = await getVisibleTrips();
  return (
    <Suspense
      fallback={
        <div className="container-x py-16">
          <div className="skeleton h-10 w-64" />
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[4/3]" />
            ))}
          </div>
        </div>
      }
    >
      <TripsExplorer trips={trips} />
    </Suspense>
  );
}
