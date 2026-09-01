"use client";

import { Fragment } from "react";
import { CalendarDays } from "lucide-react";
import type { Departure } from "@/lib/types";
import { formatDate, formatINR, monthDay } from "@/lib/format";

export default function DeparturesTable({
  departures,
}: {
  departures: Departure[];
}) {
  if (departures.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
        No fixed departures in the current window — enquire and we&apos;ll open one
        for your dates.
      </p>
    );
  }

  const byMonth = new Map<string, Departure[]>();
  for (const d of departures) {
    const label = new Date(d.iso + "T00:00:00").toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
    byMonth.set(label, [...(byMonth.get(label) ?? []), d]);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-surface">
      <table className="w-full text-sm">
        <caption className="sr-only">Scheduled departures with seats left</caption>
        <thead>
          <tr className="border-b border-line bg-surface2 text-left font-mono text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3">Departs</th>
            <th scope="col" className="px-4 py-3">Status</th>
            <th scope="col" className="hidden px-4 py-3 sm:table-cell">Price / person</th>
            <th scope="col" className="px-4 py-3 text-right">Seats</th>
          </tr>
        </thead>
        <tbody>
          {[...byMonth.entries()].map(([label, rows]) => (
            <Fragment key={`m-${rows[0]?.iso ?? label}`}>
              <tr className="bg-surface2/60">
                <td
                  colSpan={4}
                  className="px-4 py-2 font-mono text-xs font-semibold uppercase tracking-wide text-accent"
                >
                  {label}
                </td>
              </tr>
              {rows.map((d) => (
                <tr
                  key={d.iso}
                  className="border-t border-line transition-colors hover:bg-surface2/50"
                >
                  <td className="px-4 py-3 font-medium">
                    {formatDate(d.iso)}
                    <span className="ml-2 hidden font-mono text-[11px] text-muted md:inline">
                      ({monthDay(d.iso)})
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {d.seatsLeft === 0 ? (
                      <span className="rounded-full bg-danger/10 px-2 py-0.5 text-xs font-semibold text-danger">
                        Sold out
                      </span>
                    ) : d.seatsLeft <= 4 ? (
                      <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                        Filling fast
                      </span>
                    ) : (
                      <span className="rounded-full bg-ok/10 px-2 py-0.5 text-xs font-semibold text-ok">
                        Open
                      </span>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 font-mono sm:table-cell">
                    {formatINR(d.priceInr)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{d.seatsLeft}</td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
      <p className="border-t border-line px-4 py-3 text-xs text-muted">
        <CalendarDays size={12} className="mr-1 inline" aria-hidden />
        Calendar rolls forward every month. Seats are held free for 48 hours once you
        enquire.
      </p>
    </div>
  );
}
