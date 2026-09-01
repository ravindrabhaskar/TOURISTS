"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { TRIPS } from "@/lib/data/trips";
import { MONTHS_FULL, currentMonth } from "@/lib/season";
import Frame from "@/components/ui/Frame";
import { cn } from "@/lib/cn";

const SLIDES = ["kenya-masai-mara", "italy-classics", "switzerland-alps-rail", "bali-nusa-islands"];

export default function Hero() {
  const router = useRouter();
  const [slide, setSlide] = useState(0);
  const [month, setMonth] = useState<string>("any");
  const [region, setRegion] = useState<string>("any");
  const [budget, setBudget] = useState<string>("any");

  useEffect(() => {
    const id = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6500);
    return () => clearInterval(id);
  }, []);

  const slides = SLIDES.map((s) => TRIPS.find((t) => t.slug === s)!).filter(Boolean);

  const search = () => {
    const p = new URLSearchParams();
    if (month !== "any") p.set("month", month);
    if (region !== "any") p.set("region", region);
    if (budget !== "any") p.set("budget", budget);
    router.push(`/trips${p.size ? `?${p.toString()}` : ""}`);
  };

  const m = currentMonth();

  return (
    <section className="relative isolate overflow-hidden" aria-label="Featured destinations">
      <div className="absolute inset-0 -z-10">
        {slides.map((t, i) => (
          <div
            key={t.slug}
            aria-hidden={i !== slide}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000",
              i === slide ? "opacity-100" : "opacity-0",
            )}
          >
            <Frame
              src={t.cover}
              alt=""
              fallbackSeed={`hero-${t.slug}`}
              sizes="100vw"
              priority={i === 0}
              className={cn("h-full w-full", i === slide && "[&>img]:animate-kenburns")}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-bg/95 dark:to-bg/98" />
      </div>

      <button
        type="button"
        onClick={() => setSlide((s) => (s - 1 + slides.length) % slides.length)}
        aria-label="Previous photo"
        className="absolute left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 md:flex"
      >
        <ChevronLeft size={20} />
      </button>
      <button
        type="button"
        onClick={() => setSlide((s) => (s + 1) % slides.length)}
        aria-label="Next photo"
        className="absolute right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition hover:bg-black/60 md:flex"
      >
        <ChevronRight size={20} />
      </button>

      <div className="container-x flex min-h-[78svh] flex-col justify-end pb-10 pt-24 sm:min-h-[82svh]">
        <p className="mb-4 flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.22em] text-white/85">
          <Star size={13} className="fill-gold text-gold" aria-hidden />
          Rated 4.8 by 2,300+ travellers
        </p>
        <h1 className="max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-white sm:text-6xl lg:text-7xl">
          The right month makes
          <br />
          the <em className="italic text-accent-strong dark:text-accent">right</em> trip.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-white/90 sm:text-lg">
          Thirty-two small-group journeys run in-house from Hyderabad since 2011 —
          each one planned around when it&apos;s actually good, not just where it goes.
          Right now we&apos;d point you at{" "}
          <Link
            href={`/trips?month=${m}`}
            className="font-semibold underline decoration-accent decoration-2 underline-offset-4"
          >
            {MONTHS_FULL[m]}
          </Link>
          .
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trips" className="btn btn-primary px-6 py-3 text-base">
            Browse the 32 trips
          </Link>
          <Link
            href="/#how"
            className="btn border border-white/40 bg-white/10 px-6 py-3 text-base text-white backdrop-blur hover:bg-white/20"
          >
            How it works
          </Link>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
          className="card mt-10 grid gap-3 p-3 shadow-xl sm:grid-cols-[1fr_1fr_1fr_auto]"
          aria-label="Quick trip finder"
        >
          <label className="block">
            <span className="mb-1 block px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
              Going in
            </span>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="field min-h-11"
            >
              <option value="any">Any month</option>
              {MONTHS_FULL.map((name, i) => (
                <option key={name} value={i}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
              Where
            </span>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="field min-h-11"
            >
              <option value="any">Anywhere</option>
              {[...new Set(TRIPS.map((t) => t.region))].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block px-1 text-[11px] font-medium uppercase tracking-wide text-muted">
              Budget / person
            </span>
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="field min-h-11"
            >
              <option value="any">Any budget</option>
              <option value="under-30">Under ₹30k</option>
              <option value="30-60">₹30k – ₹60k</option>
              <option value="above-60">₹60k +</option>
            </select>
          </label>
          <button type="submit" className="btn btn-primary self-end px-7 py-3">
            Show trips
          </button>
        </form>
      </div>
    </section>
  );
}
