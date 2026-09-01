import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { COLLECTIONS } from "@/lib/data/site";
import Frame from "@/components/ui/Frame";
import SectionHead from "@/components/ui/SectionHead";
import Reveal from "@/components/ui/Reveal";

export default function Collections() {
  return (
    <section id="collections" className="container-x scroll-mt-24 py-16 sm:py-20">
      <Reveal>
        <SectionHead
          eyebrow="Curated"
          title="Start from a mood, not a map"
          sub="Hand-picked shelves of the catalogue — each one a live, shareable filter."
        />
      </Reveal>

      <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 lg:grid lg:grid-cols-4 lg:overflow-visible">
        {COLLECTIONS.map((c, i) => (
          <Reveal key={c.title} index={i} className="w-72 shrink-0 snap-start sm:w-80 lg:w-auto">
            <Link
              href={c.href}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
            >
              <Frame
                src={c.image}
                alt=""
                fallbackSeed={`collection-${i}`}
                sizes="(max-width: 1024px) 80vw, 25vw"
                className="h-full w-full [&>img]:transition-transform [&>img]:duration-700 group-hover:[&>img]:scale-105"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-5">
                <span className="block font-display text-xl font-semibold text-white">
                  {c.title}
                </span>
                <span className="mt-1 block text-sm text-white/80">{c.sub}</span>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                  Open shelf
                  <ArrowRight
                    size={15}
                    className="transition-transform group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
