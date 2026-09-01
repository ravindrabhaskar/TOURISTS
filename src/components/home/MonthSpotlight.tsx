"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TRIPS } from "@/lib/data/trips";
import { MONTHS_FULL, currentMonth } from "@/lib/season";
import TripCard from "@/components/trips/TripCard";
import Reveal from "@/components/ui/Reveal";
import SectionHead from "@/components/ui/SectionHead";
import { cn } from "@/lib/cn";

export default function MonthSpotlight() {
  const today = currentMonth();
  const [month, setMonth] = useState(today);

  const trips = useMemo(
    () =>
      TRIPS.filter((t) => t.season[month] === 2).sort((a, b) => a.priceInr - b.priceInr),
    [month],
  );
  const shoulder = useMemo(() => TRIPS.filter((t) => t.season[month] === 1), [month]);

  return (
    <section className="border-y border-line bg-surface py-16 sm:py-20">
      <div className="container-x">
        <Reveal>
          <SectionHead
            eyebrow="The honest calendar"
            title={`Where to go in ${MONTHS_FULL[month]}`}
            sub="Pulled live from each trip's twelve-month season data — prime months only. This is the same bar our planners use."
          />
        </Reveal>

        <Reveal index={1}>
          <div
            className="no-scrollbar mt-8 flex gap-2 overflow-x-auto pb-2"
            role="group"
            aria-label="Pick a month"
          >
            {MONTHS_FULL.map((name, i) => (
              <button
                key={name}
                type="button"
                onClick={() => setMonth(i)}
                aria-pressed={month === i}
                className={cn("chip", month === i && "active")}
              >
                {name}
                {i === today && (
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-label="(this month)" />
                )}
              </button>
            ))}
          </div>
        </Reveal>

        {trips.length > 0 ? (
          <>
            <p className="mt-6 text-sm text-muted">
              <span className="font-semibold text-ink">{trips.length} trips</span> are in
              their prime window in {MONTHS_FULL[month]}.
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {trips.slice(0, 4).map((t, i) => (
                <Reveal key={t.slug} index={i % 4}>
                  <TripCard trip={t} />
                </Reveal>
              ))}
            </div>
            <Link
              href={`/trips?month=${month}`}
              className="btn btn-outline mt-7 inline-flex"
            >
              See all {trips.length} prime in {MONTHS_FULL[month]}
            </Link>
          </>
        ) : (
          <p className="mt-6 rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
            Nothing runs in {MONTHS_FULL[month]} — we close routes we wouldn&apos;t
            enjoy ourselves.
          </p>
        )}

        {shoulder.length > 0 && (
          <p className="mt-4 text-sm text-muted">
            Shoulder-season options exist too:{" "}
            {shoulder.slice(0, 3).map((t, i) => (
              <span key={t.slug}>
                {i > 0 && ", "}
                <Link href={`/trips/${t.slug}`} className="underline hover:text-accent">
                  {t.name}
                </Link>
              </span>
            ))}
            {shoulder.length > 3 && ` and ${shoulder.length - 3} more`} — fewer crowds,
            softer prices.
          </p>
        )}
      </div>
    </section>
  );
}
