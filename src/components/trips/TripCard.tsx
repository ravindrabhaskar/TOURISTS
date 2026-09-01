"use client";

import Link from "next/link";
import { ArrowUpRight, Clock, Heart, Scale, Users } from "lucide-react";
import type { Trip } from "@/lib/types";
import { bestMonthsLabel } from "@/lib/season";
import Frame from "@/components/ui/Frame";
import PriceTag from "@/components/ui/PriceTag";
import Rating from "@/components/ui/Rating";
import SeasonBar from "@/components/ui/SeasonBar";
import { useShortlist, useCompare } from "@/lib/store";
import { cn } from "@/lib/cn";

export default function TripCard({
  trip,
  index = 0,
}: {
  trip: Trip;
  index?: number;
}) {
  const shortlist = useShortlist();
  const compare = useCompare();
  const saved = shortlist.has(trip.slug);
  const comparing = compare.has(trip.slug);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-all duration-300",
        "hover:-translate-y-1 hover:shadow-[0_18px_40px_-18px_rgba(60,40,20,0.35)]",
      )}
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Link
        href={`/trips/${trip.slug}`}
        className="relative block aspect-[4/3]"
        aria-label={`${trip.name}, ${trip.region}`}
      >
        <Frame
          src={trip.cover}
          alt={trip.name}
          fallbackSeed={`tw-${trip.slug}`}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="h-full w-full [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] font-medium text-white backdrop-blur">
          {trip.region}
        </span>
        <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 font-mono text-[11px] text-white backdrop-blur">
          <Clock size={11} aria-hidden /> {trip.days}d
          <span aria-hidden>·</span>
          <Users size={11} aria-hidden /> ≤{trip.maxGroup}
        </span>
      </Link>

      <button
        type="button"
        onClick={() => shortlist.toggle(trip.slug)}
        aria-pressed={saved}
        aria-label={saved ? `Remove ${trip.name} from shortlist` : `Save ${trip.name} to shortlist`}
        className={cn(
          "absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-colors",
          saved ? "bg-accent text-white" : "bg-black/45 text-white hover:bg-black/65",
        )}
      >
        <Heart size={17} className={saved ? "fill-current" : ""} />
      </button>

      <button
        type="button"
        onClick={() => compare.toggle(trip.slug)}
        aria-pressed={comparing}
        aria-label={comparing ? `Remove ${trip.name} from compare` : `Compare ${trip.name}`}
        className={cn(
          "absolute right-3 top-[3.75rem] z-10 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-colors",
          comparing
            ? "bg-pine text-white dark:text-[#0e1512]"
            : "bg-black/45 text-white hover:bg-black/65",
        )}
      >
        <Scale size={16} />
      </button>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-semibold leading-snug">
            <Link href={`/trips/${trip.slug}`} className="hover:text-accent">
              {trip.name}
            </Link>
          </h3>
          <Rating rating={trip.rating} />
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{trip.blurb}</p>

        <div className="mt-auto space-y-2.5 pt-1">
          <SeasonBar season={trip.season} />
          <p className="text-xs text-muted">
            Best time:{" "}
            <span className="font-mono text-ink">{bestMonthsLabel(trip)}</span>
          </p>
          <div className="flex items-end justify-between border-t border-line pt-3">
            <div>
              <PriceTag inr={trip.priceInr} className="text-lg font-semibold" />
              <p className="text-[11px] uppercase tracking-wide text-muted">per person</p>
            </div>
            <Link
              href={`/trips/${trip.slug}`}
              className="flex min-h-9 items-center gap-1 rounded-full border border-line px-3 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
            >
              View <ArrowUpRight size={14} aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
