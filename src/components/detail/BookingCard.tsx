"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShieldCheck,
} from "lucide-react";
import type { Departure, Trip } from "@/lib/types";
import { estimateTotal } from "@/lib/departures";
import { formatDate, formatINR } from "@/lib/format";
import { whatsappLink } from "@/lib/data/site";
import PriceTag from "@/components/ui/PriceTag";
import { useShortlist, useToast } from "@/lib/store";
import { cn } from "@/lib/cn";

export default function BookingCard({
  trip,
  departures,
}: {
  trip: Trip;
  departures: Departure[];
}) {
  const shortlist = useShortlist();
  const { push } = useToast();
  const saved = shortlist.has(trip.slug);
  const [depIso, setDepIso] = useState<string>("flexible");
  const [travellers, setTravellers] = useState(2);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const est = useMemo(
    () =>
      estimateTotal(
        trip.priceInr,
        travellers,
        depIso === "flexible" ? null : depIso,
      ),
    [trip.priceInr, travellers, depIso],
  );

  const enquireHref = `/enquire?trip=${trip.slug}&travellers=${travellers}${
    depIso === "flexible" ? "" : `&date=${depIso}`
  }`;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      push("Link copied — send it to the group chat.");
    } catch {
      push("Couldn't reach the clipboard.", "warn");
    }
  };

  return (
    <aside
      className="card sticky top-24 overflow-hidden shadow-lg"
      aria-label="Book this trip"
    >
      <div className="border-b border-line p-5">
        <div className="flex items-baseline justify-between gap-2">
          <PriceTag inr={est.perPerson} className="text-3xl font-semibold" />
          <span className="text-xs text-muted">per person</span>
        </div>
        <p className="mt-1 text-xs text-muted">
          Base {formatINR(trip.priceInr)} · ex-{trip.startCities[0]} land package
        </p>
      </div>

      <div className="space-y-5 p-5">
        <label className="block">
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium">
            <CalendarDays size={15} className="text-accent" aria-hidden /> Departure
          </span>
          <select
            value={depIso}
            onChange={(e) => setDepIso(e.target.value)}
            className="field"
            aria-label="Choose a departure date"
          >
            <option value="flexible">I&apos;m flexible — suggest dates</option>
            {!mounted &&
              departures.slice(0, 3).map((d) => (
                <option key={d.iso} value={d.iso}>
                  {formatDate(d.iso)} · {formatINR(d.priceInr)}
                </option>
              ))}
            {mounted &&
              departures.map((d) => (
                <option key={d.iso} value={d.iso} disabled={d.seatsLeft === 0}>
                  {formatDate(d.iso)} · {formatINR(d.priceInr)} ·{" "}
                  {d.seatsLeft === 0 ? "Sold out" : `${d.seatsLeft} seats left`}
                </option>
              ))}
            {mounted && departures.length === 0 && (
              <option value="">No scheduled departures this window</option>
            )}
          </select>
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium">Travellers</span>
          <div className="flex items-center justify-between rounded-xl border border-line px-3 py-2">
            <span className="font-mono text-sm">{travellers}</span>
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => setTravellers((n) => Math.max(1, n - 1))}
                aria-label="Fewer travellers"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-surface2"
              >
                <Minus size={14} aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => setTravellers((n) => Math.min(16, n + 1))}
                aria-label="More travellers"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-line hover:bg-surface2"
              >
                <Plus size={14} aria-hidden />
              </button>
            </span>
          </div>
          {travellers >= 4 && est.groupPct > 0 && (
            <p className="mt-1.5 text-xs font-medium text-ok">
              Group saving of {est.groupPct}% applied automatically.
            </p>
          )}
        </div>

        <dl className="space-y-1.5 rounded-xl bg-surface2 p-3.5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">
              {travellers} × per person{est.groupPct > 0 ? ` (−${est.groupPct}%)` : ""}
            </dt>
            <dd className="font-mono">{formatINR(est.perPerson * travellers)}</dd>
          </div>
          {est.earlyBird && (
            <div className="flex justify-between text-ok">
              <dt>Early-bird (90+ days)</dt>
              <dd className="font-mono">−{formatINR(5000 * travellers)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-semibold">
            <dt>Estimated total</dt>
            <dd className="font-mono">{formatINR(est.total)}</dd>
          </div>
          <p className="pt-0.5 text-[11px] leading-snug text-muted">
            Indicative only — your planner confirms exact figures in writing.
          </p>
        </dl>

        <Link href={enquireHref} className="btn btn-primary w-full py-3 text-base">
          Hold these seats free
        </Link>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              shortlist.toggle(trip.slug);
              push(saved ? "Removed from shortlist." : "Saved to your shortlist.");
            }}
            aria-pressed={saved}
            className={cn("btn", saved ? "btn-pine" : "btn-outline")}
          >
            <Heart size={15} className={saved ? "fill-current" : ""} aria-hidden />
            {saved ? "Saved" : "Save"}
          </button>
          <button type="button" onClick={share} className="btn btn-outline">
            <Share2 size={15} aria-hidden /> Share
          </button>
          <a
            href={whatsappLink(
              `Hi Trade Winds! I'm looking at ${trip.name} (${trip.days} days). A few questions…`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-outline"
          >
            <MessageCircle size={15} aria-hidden /> WhatsApp
          </a>
        </div>

        <ul className="space-y-1.5 border-t border-line pt-4 text-xs text-muted">
          <li className="flex items-center gap-2">
            <ShieldCheck size={14} className="text-pine" aria-hidden />
            Free cancellation until 45 days out
          </li>
          <li className="flex items-center gap-2">
            <BadgeCheck size={14} className="text-pine" aria-hidden />
            No payment now — planner confirms first
          </li>
        </ul>
      </div>
    </aside>
  );
}
