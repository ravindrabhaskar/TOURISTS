import { Star } from "lucide-react";
import { TESTIMONIALS } from "@/lib/data/site";
import type { Trip } from "@/lib/types";

function pickReviews(slug: string): typeof TESTIMONIALS {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  const out: typeof TESTIMONIALS = [];
  for (let i = 0; i < 3; i++) {
    const pick = TESTIMONIALS[(h + i * 2) % TESTIMONIALS.length];
    if (pick) out.push(pick);
  }
  return out;
}

export default function Reviews({ trip }: { trip: Trip }) {
  const reviews = pickReviews(trip.slug);
  const pct5 = Math.round((trip.rating - 4) * 55 + 40);
  const pct4 = Math.max(4, 100 - pct5 - 6);
  const dist: Array<[number, number]> = [
    [5, pct5],
    [4, pct4],
    [3, 6],
    [2, 1],
    [1, 0],
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-6 rounded-2xl border border-line bg-surface p-6 sm:flex-row sm:items-center">
        <div className="text-center sm:w-32">
          <p className="font-mono text-5xl font-semibold">{trip.rating.toFixed(1)}</p>
          <div
            className="mt-1 flex justify-center gap-0.5"
            aria-label={`Rated ${trip.rating} out of 5`}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={
                  i < Math.round(trip.rating)
                    ? "fill-gold text-gold"
                    : "text-line"
                }
                aria-hidden
              />
            ))}
          </div>
          <p className="mt-1 text-xs text-muted">{trip.reviewCount} verified reviews</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(([stars, pct]) => (
            <div key={stars} className="flex items-center gap-2 text-xs">
              <span className="w-8 font-mono">{stars}★</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <span className="w-9 text-right font-mono text-muted">{pct}%</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.name + r.trip} className="card p-5">
            <div className="flex gap-0.5" aria-label={`${r.rating} stars`}>
              {Array.from({ length: r.rating }).map((_, s) => (
                <Star key={s} size={12} className="fill-gold text-gold" aria-hidden />
              ))}
            </div>
            <blockquote className="mt-3 text-sm leading-relaxed">
              “{r.quote}”
            </blockquote>
            <figcaption className="mt-3 text-xs text-muted">
              <span className="font-semibold text-ink">{r.name}</span> · {r.trip}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
