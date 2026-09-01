"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ListFilter, SlidersHorizontal } from "lucide-react";
import {
  DEFAULT_FILTERS,
  applyFilters,
  countActive,
  filtersToParams,
  parseFilters,
  type FilterState,
} from "@/lib/filters";
import { MONTHS_FULL } from "@/lib/season";
import type { SortKey, Trip } from "@/lib/types";
import TripCard from "@/components/trips/TripCard";
import FiltersPanel from "@/components/trips/FiltersPanel";
import Modal from "@/components/ui/Modal";
import Reveal from "@/components/ui/Reveal";

const SORTS: Array<[SortKey, string]> = [
  ["popular", "Most loved"],
  ["price-asc", "Price · low to high"],
  ["price-desc", "Price · high to low"],
  ["duration", "Shortest first"],
];

function activePills(state: FilterState): Array<{ label: string; clear: FilterState }> {
  const pills: Array<{ label: string; clear: FilterState }> = [];
  const base = () => ({ ...state });
  if (state.q)
    pills.push({ label: `“${state.q}”`, clear: { ...base(), q: "" } });
  if (state.region)
    pills.push({ label: state.region, clear: { ...base(), region: "" } });
  if (state.month >= 0)
    pills.push({
      label: MONTHS_FULL[state.month] ?? "Any month",
      clear: { ...base(), month: -1 },
    });
  if (state.dur !== "any")
    pills.push({ label: state.dur === "short" ? "≤5 days" : state.dur === "week" ? "6–8 days" : "9+ days", clear: { ...base(), dur: "any" } });
  if (state.budget !== "any")
    pills.push({
      label: state.budget === "under-30" ? "Under ₹30k" : state.budget === "30-60" ? "₹30–60k" : "₹60k+",
      clear: { ...base(), budget: "any" },
    });
  if (state.tag) pills.push({ label: state.tag, clear: { ...base(), tag: "" } });
  return pills;
}

export default function TripsExplorer({ trips }: { trips: Trip[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<FilterState>(() => parseFilters(sp));
  const [mobileFilters, setMobileFilters] = useState(false);
  const lastWritten = useRef<string | null>(null);

  useEffect(() => {
    const incoming = sp.toString();
    if (lastWritten.current === incoming) return;
    if (incoming === filtersToParams(state).toString()) return;
    const id = requestAnimationFrame(() => setState(parseFilters(sp)));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    const s = filtersToParams(state).toString();
    if (s === lastWritten.current) return;
    lastWritten.current = s;
    router.replace(s ? `/trips?${s}` : "/trips", { scroll: false });
  }, [state, router]);

  const results = useMemo(() => applyFilters(trips, state), [trips, state]);
  const nActive = countActive(state);
  const pills = activePills(state);

  return (
    <div className="container-x py-10 sm:py-12">
      <header className="max-w-2xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
          The catalogue
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold sm:text-5xl">
          Thirty-two ways to go
        </h1>
        <p className="mt-3 text-muted">
          Every trip is priced per person ex-India and graded month by month. Filter
          until it fits, then hold seats free for 48 hours.
        </p>
      </header>

      <div className="mt-8 flex items-center justify-between gap-3 border-y border-line py-3">
        <p aria-live="polite" className="text-sm text-muted">
          <span className="font-semibold text-ink">{results.length}</span> of{" "}
          {trips.length} trips
          {nActive > 0 && ` · ${nActive} filter${nActive > 1 ? "s" : ""}`}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileFilters(true)}
            className="btn btn-outline relative lg:hidden"
          >
            <SlidersHorizontal size={15} aria-hidden /> Filters
            {nActive > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-white">
                {nActive}
              </span>
            )}
          </button>
          <label className="flex items-center gap-2 text-sm">
            <ListFilter size={15} className="hidden text-muted sm:block" aria-hidden />
            <span className="sr-only">Sort trips</span>
            <select
              value={state.sort}
              onChange={(e) =>
                setState((s) => ({ ...s, sort: e.target.value as SortKey }))
              }
              className="field min-h-11 w-auto cursor-pointer"
              aria-label="Sort"
            >
              {SORTS.map(([v, label]) => (
                <option key={v} value={v}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {pills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <button
              key={pill.label}
              type="button"
              onClick={() => setState(pill.clear)}
              className="chip active gap-1.5"
            >
              {pill.label}
              <span aria-hidden>×</span>
              <span className="sr-only">Remove filter</span>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 flex gap-10">
        <aside
          className="sticky top-24 hidden h-fit max-h-[calc(100vh-7rem)] w-64 shrink-0 overflow-y-auto pr-2 lg:block"
          aria-label="Filters"
        >
          <FiltersPanel onChange={setState} state={state} />
        </aside>

        <div className="min-w-0 flex-1">
          {results.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((t, i) => (
                <Reveal key={t.slug} index={i % 3}>
                  <TripCard trip={t} index={i} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-line bg-surface px-6 py-16 text-center">
              <p className="font-display text-2xl font-semibold">
                Nothing runs like that — yet.
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                We close routes we wouldn&apos;t enjoy ourselves. Try widening the
                month, or take a look at these instead:
              </p>
              <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
                {applyFilters(trips, { ...DEFAULT_FILTERS })
                  .slice(0, 3)
                  .map((t) => (
                    <Link
                      key={t.slug}
                      href={`/trips/${t.slug}`}
                      className="card p-4 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="font-mono text-[11px] uppercase tracking-wide text-accent">
                        {t.region}
                      </p>
                      <p className="mt-1 font-display font-semibold leading-snug">
                        {t.name}
                      </p>
                      <p className="mt-1 text-xs text-muted">{t.days} days</p>
                    </Link>
                  ))}
              </div>
              <button
                type="button"
                onClick={() => setState(DEFAULT_FILTERS)}
                className="btn btn-primary mt-8"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        open={mobileFilters}
        onClose={() => setMobileFilters(false)}
        label="Filters"
      >
        <div className="p-6 pt-14">
          <FiltersPanel
            state={state}
            onChange={(next) => {
              setState(next);
            }}
          />
          <button
            type="button"
            onClick={() => setMobileFilters(false)}
            className="btn btn-primary mt-5 w-full"
          >
            Show {results.length} trip{results.length !== 1 ? "s" : ""}
          </button>
        </div>
      </Modal>
    </div>
  );
}

