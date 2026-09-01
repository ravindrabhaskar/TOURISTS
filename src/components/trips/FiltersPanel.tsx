"use client";

import { X } from "lucide-react";
import { REGIONS, type Region } from "@/lib/types";
import { MONTHS } from "@/lib/season";
import { DEFAULT_FILTERS, countActive, type FilterState } from "@/lib/filters";
import { cn } from "@/lib/cn";

const TAGS = [
  "Trekking",
  "Wildlife",
  "Beaches",
  "Islands",
  "Heritage",
  "Food",
  "Festival",
  "Rail",
  "Deserts",
  "Slow Travel",
];

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-line pb-5 last:border-0">
      <legend className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
        {label}
      </legend>
      {children}
    </fieldset>
  );
}

export default function FiltersPanel({
  state,
  onChange,
}: {
  state: FilterState;
  onChange: (next: FilterState) => void;
}) {
  const set = <K extends keyof FilterState>(key: K, value: FilterState[K]) =>
    onChange({ ...state, [key]: value });

  const active = countActive(state);

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      aria-label="Filter trips"
      className="space-y-5"
    >
      <Group label="Search">
        <input
          type="search"
          value={state.q}
          onChange={(e) => set("q", e.target.value)}
          placeholder="Ladakh, safari, beaches…"
          aria-label="Search trips"
          className="field"
        />
      </Group>

      <Group label="Month">
        <div className="grid grid-cols-4 gap-1.5">
          {MONTHS.map((mo, i) => (
            <button
              key={mo}
              type="button"
              onClick={() => set("month", state.month === i ? -1 : i)}
              aria-pressed={state.month === i}
              className={cn(
                "min-h-10 rounded-lg border border-line bg-surface text-xs font-medium transition-colors hover:border-muted",
                state.month === i && "border-ink bg-ink text-bg",
              )}
            >
              {mo}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Region">
        <select
          value={state.region}
          onChange={(e) => set("region", e.target.value as Region | "")}
          aria-label="Region"
          className="field"
        >
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </Group>

      <Group label="Duration">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["any", "Any"],
              ["short", "≤5 days"],
              ["week", "6–8 days"],
              ["long", "9+ days"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => set("dur", v)}
              aria-pressed={state.dur === v}
              className={cn("chip", state.dur === v && "active")}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Budget / person">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["any", "Any"],
              ["under-30", "< ₹30k"],
              ["30-60", "₹30–60k"],
              ["above-60", "> ₹60k"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              onClick={() => set("budget", v)}
              aria-pressed={state.budget === v}
              className={cn("chip", state.budget === v && "active")}
            >
              {label}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Interest">
        <div className="flex flex-wrap gap-1.5">
          {TAGS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("tag", state.tag === t ? "" : t)}
              aria-pressed={state.tag === t}
              className={cn("chip", state.tag === t && "active")}
            >
              {t}
            </button>
          ))}
        </div>
      </Group>

      {active > 0 && (
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_FILTERS, sort: state.sort })}
          className="btn btn-outline w-full"
        >
          <X size={15} aria-hidden /> Clear {active} filter{active > 1 ? "s" : ""}
        </button>
      )}
    </form>
  );
}
