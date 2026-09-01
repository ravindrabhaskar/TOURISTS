"use client";

import { useState } from "react";
import { MONTHS, MONTHS_FULL, SEASON_LABEL, seasonVerdict } from "@/lib/season";
import type { Trip } from "@/lib/types";
import { cn } from "@/lib/cn";

const DOT: Record<number, string> = {
  0: "bg-surface2 border border-line",
  1: "bg-gold/50",
  2: "bg-pine",
};

export default function SeasonHeatmap({ trip }: { trip: Trip }) {
  const [month, setMonth] = useState(new Date().getMonth());

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-display text-xl font-semibold">When to go</h3>
        <div className="flex items-center gap-3 text-[11px] text-muted">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-pine" /> Prime
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-gold/60" /> Shoulder
          </span>
          <span className="flex items-center gap-1">
            <span className={cn("h-2.5 w-2.5 rounded-full", DOT[0])} /> Closed
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-12 gap-1" role="group" aria-label="Months">
        {trip.season.map((s, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setMonth(i)}
            aria-pressed={month === i}
            aria-label={`${MONTHS_FULL[i]}: ${SEASON_LABEL[s]}`}
            className="group flex flex-col items-center gap-1.5"
          >
            <span
              className={cn(
                "flex h-14 w-full items-end justify-center rounded-lg transition-all",
                DOT[s],
                month === i && "ring-2 ring-accent ring-offset-1 ring-offset-surface",
              )}
            >
              <span
                className="mb-1 h-full w-full max-w-[18px] rounded-md bg-black/[0.06] dark:bg-white/[0.04]"
                style={{ height: `${25 + s * 32}%`, alignSelf: "end" }}
              />
            </span>
            <span
              className={cn(
                "font-mono text-[10px]",
                month === i ? "font-bold text-accent" : "text-muted",
              )}
            >
              {MONTHS[i]}
            </span>
          </button>
        ))}
      </div>

      <p className="mt-4 min-h-6 text-sm font-medium" aria-live="polite">
        {seasonVerdict(trip, month)}
      </p>
    </div>
  );
}
