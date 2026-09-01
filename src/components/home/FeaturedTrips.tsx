import Link from "next/link";
import { popularTrips } from "@/lib/data/trips";
import TripCard from "@/components/trips/TripCard";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

export default function FeaturedTrips() {
  const trips = popularTrips().slice(0, 6);

  return (
    <section className="container-x py-16 sm:py-20">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHead
            eyebrow="Most loved"
            title="The trips people keep booking"
            sub="Ranked by repeat travellers and reviews — not by what we want to sell this quarter."
          />
          <Link href="/trips" className="btn btn-outline">
            All 32 trips
          </Link>
        </div>
      </Reveal>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {trips.map((t, i) => (
          <Reveal key={t.slug} index={i % 3}>
            <TripCard trip={t} index={i} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
