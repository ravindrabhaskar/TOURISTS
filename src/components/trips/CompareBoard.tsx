"use client";

import Link from "next/link";
import { ArrowRight, Trash2, Users } from "lucide-react";
import { TRIPS } from "@/lib/data/trips";
import { useCompare } from "@/lib/store";
import type { Trip } from "@/lib/types";
import { bestMonthsLabel, MONTHS_FULL } from "@/lib/season";
import Frame from "@/components/ui/Frame";
import PriceTag from "@/components/ui/PriceTag";
import Rating from "@/components/ui/Rating";
import SeasonBar from "@/components/ui/SeasonBar";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <td
        scope="row"
        className="w-32 px-4 py-3 align-top font-mono text-[11px] uppercase tracking-wide text-muted"
      >
        {label}
      </td>
      {children}
    </>
  );
}

const CELL = "border-l border-line px-4 py-3 align-top";

export default function CompareBoard() {
  const compare = useCompare();
  const trips = compare.slugs
    .map((s) => TRIPS.find((t) => t.slug === s))
    .filter((t): t is Trip => Boolean(t));

  if (!compare.ready || trips.length === 0) {
    return (
      <div className="mt-12 rounded-3xl border border-dashed border-line px-6 py-20 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
          <Users size={24} aria-hidden />
        </span>
        <p className="mt-5 font-display text-2xl font-semibold">Nothing to weigh yet.</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Tap the scale button on any trip card to add it here — up to four at a time.
        </p>
        <Link href="/trips" className="btn btn-primary mt-7">
          Browse the catalogue
        </Link>
      </div>
    );
  }

  const cheapest = Math.min(...trips.map((t) => t.priceInr));

  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="w-full min-w-[40rem]">
        <caption className="sr-only">Trip comparison</caption>
        <thead>
          <tr>
            <th scope="col" className="w-32" />
            {trips.map((t) => (
              <th key={t.slug} scope="col" className="min-w-52 p-4 text-left align-top">
                <div className="relative overflow-hidden rounded-xl">
                  <Frame
                    src={t.cover}
                    alt=""
                    fallbackSeed={`cmp-${t.slug}`}
                    sizes="260px"
                    className="aspect-[16/9] w-full"
                  />
                  <button
                    type="button"
                    onClick={() => compare.remove(t.slug)}
                    aria-label={`Remove ${t.name}`}
                    className="absolute right-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70"
                  >
                    <Trash2 size={13} aria-hidden />
                  </button>
                </div>
                <h2 className="mt-3 font-display text-lg font-semibold leading-snug">{t.name}</h2>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-muted">
                  {t.region} · {t.country}
                </p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-t border-line">
            <Row label="Price / person">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <span
                    className={`inline-flex items-baseline gap-2 rounded-lg ${
                      t.priceInr === cheapest && trips.length > 1 ? "bg-ok/10 px-2 py-1 ring-1 ring-ok/40" : ""
                    }`}
                  >
                    <PriceTag inr={t.priceInr} className="text-lg font-semibold" />
                    {t.priceInr === cheapest && trips.length > 1 && (
                      <span className="text-[11px] font-semibold text-ok">lowest</span>
                    )}
                  </span>
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Duration">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  {t.days} days · {t.days - 1} nights
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Best months">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <span className="font-mono text-sm">{bestMonthsLabel(t)}</span>
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Season bar">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <SeasonBar season={t.season} showLabels />
                  <p className="mt-1.5 font-mono text-[10px] text-muted">
                    Prime:{" "}
                    {t.season.filter((s) => s === 2).length}/12 months · Open:{" "}
                    {t.season.filter((s) => s > 0).length}/12
                  </p>
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Rating">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <Rating rating={t.rating} count={t.reviewCount} />
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Pace & group">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <p>{t.difficulty}</p>
                  <p className="text-xs text-muted">Max {t.maxGroup} travellers</p>
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Start cities">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  {t.startCities.join(", ")}
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <Row label="Interests">
              {trips.map((t) => (
                <td key={t.slug} className={CELL}>
                  <div className="flex flex-wrap gap-1">
                    {t.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-surface2 px-2 py-0.5 text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              ))}
            </Row>
          </tr>
          <tr className="border-t border-line">
            <td />
            {trips.map((t) => (
              <td key={t.slug} className={CELL}>
                <div className="flex flex-wrap gap-2 pb-4">
                  <Link href={`/trips/${t.slug}`} className="btn btn-outline min-h-9 px-4 text-xs">
                    View trip
                  </Link>
                  <Link
                    href={`/enquire?trip=${t.slug}&travellers=2`}
                    className="btn btn-primary min-h-9 px-4 text-xs"
                  >
                    Hold seats <ArrowRight size={12} aria-hidden />
                  </Link>
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 font-mono text-[11px] text-muted">
        Season bars read left to right, January ({MONTHS_FULL[0]}) to December.
      </p>
    </div>
  );
}

