import Link from "next/link";
import { TRIPS } from "@/lib/data/trips";
import type { Region } from "@/lib/types";
import Frame from "@/components/ui/Frame";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";

const ORDER: Region[] = [
  "Himalaya",
  "South India",
  "Northeast India",
  "Desert & Rajasthan",
  "Southeast Asia",
  "Africa",
  "Europe",
  "Central Asia & Middle East",
];

export default function RegionsGrid() {
  return (
    <section id="regions" className="bg-surface2 py-16 sm:py-20">
      <div className="container-x scroll-mt-24">
        <Reveal>
          <SectionHead
            eyebrow="Where we go"
            title="Eight regions, thirty-two ways in"
            sub="Every route is walked by us before it is sold by us."
          />
        </Reveal>

        <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {ORDER.map((region, i) => {
            const trips = TRIPS.filter((t) => t.region === region);
            const rep = trips.find((t) => t.popular) ?? trips[0];
            if (!rep) return null;
            return (
              <li key={region}>
                <Reveal index={i % 4}>
                  <Link
                    href={`/trips?region=${encodeURIComponent(region)}`}
                    className="group relative block aspect-[5/4] overflow-hidden rounded-2xl border border-line"
                  >
                    <Frame
                      src={rep.cover}
                      alt=""
                      fallbackSeed={`region-${rep.slug}`}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="h-full w-full [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/5" />
                    <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
                      <span>
                        <span className="block font-display text-base font-semibold text-white sm:text-lg">
                          {region}
                        </span>
                        <span className="font-mono text-[11px] text-white/75">
                          {trips.length} trip{trips.length > 1 ? "s" : ""}
                        </span>
                      </span>
                      <span className="rounded-full bg-white/15 px-2 py-1 text-xs font-semibold text-white backdrop-blur transition-colors group-hover:bg-accent">
                        Explore
                      </span>
                    </span>
                  </Link>
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
