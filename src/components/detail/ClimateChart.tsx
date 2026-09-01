"use client";

import { CLIMATE_PROFILES, TRIP_CLIMATE } from "@/lib/data/climate";
import { MONTHS } from "@/lib/season";
import type { Trip } from "@/lib/types";

export default function ClimateChart({ trip }: { trip: Trip }) {
  const profileName = TRIP_CLIMATE[trip.slug];
  if (!profileName) return null;
  const profile = CLIMATE_PROFILES[profileName];
  const maxRain = Math.max(...profile.rainMm);
  const minT = Math.min(0, ...profile.avgHighC);

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-xl font-semibold">Typical conditions</h3>
        <p className="font-mono text-[11px] uppercase tracking-wide text-muted">
          {profile.label} · indicative
        </p>
      </div>

      <div
        className="mt-5 grid grid-cols-12 gap-1.5"
        role="img"
        aria-label={`Average daytime high and rainfall by month: ${profile.avgHighC
          .map((t, i) => `${MONTHS[i]} ${t} degrees, ${profile.rainMm[i]} millimetres rain`)
          .join("; ")}`}
      >
        {profile.avgHighC.map((t, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="font-mono text-[9px] text-muted">{t}°</span>
            <div className="flex h-24 w-full items-end justify-center rounded-lg bg-surface2/70">
              <div
                className="w-full max-w-[16px] rounded-md bg-gradient-to-t from-accent to-gold"
                style={{ height: `${Math.max(8, ((t - minT) / (42 - minT)) * 100)}%` }}
                title={`${MONTHS[i]}: ${t}°C avg high`}
              />
            </div>
            <div className="flex h-10 w-full items-end justify-center rounded-lg bg-pine-soft/60">
              <div
                className="w-full max-w-[16px] rounded-b-md bg-pine/80"
                style={{ height: `${Math.max(6, ((profile.rainMm[i] ?? 0) / maxRain) * 100)}%` }}
                title={`${MONTHS[i]}: ${profile.rainMm[i]}mm rain`}
              />
            </div>
            <span className="font-mono text-[10px] text-muted">{MONTHS[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-4 text-[11px] text-muted">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-accent" /> Avg daytime high
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-3 rounded-sm bg-pine" /> Rainfall
        </span>
        <span className="ml-auto font-mono">
          Peak rain {maxRain}mm in{" "}
          {MONTHS[profile.rainMm.indexOf(maxRain)]}
        </span>
      </div>
    </div>
  );
}
