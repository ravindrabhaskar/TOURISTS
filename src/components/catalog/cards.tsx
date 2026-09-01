import Link from "next/link";
import Frame from "@/components/ui/Frame";
import { Card } from "@/components/ui/primitives";
import { formatINR, formatMinutes, formatDate } from "@/lib/utils";

const GRADIENTS = [
  "from-brand-500 to-coast-700",
  "from-spice-500 to-heritage-600",
  "from-coast-500 to-brand-700",
  "from-heritage-500 to-spice-700",
  "from-brand-400 to-heritage-600",
] as const;

export function gradientFor(i: number | string): string {
  const n = typeof i === "string" ? [...i].reduce((a, c) => a + c.charCodeAt(0), 0) : i;
  return GRADIENTS[Math.abs(n) % GRADIENTS.length]!;
}

export function typeLabel(t: string): string {
  return t.toLowerCase().replace(/_/g, " ");
}

type DestCardData = {
  slug: string; name: string; type: string; summary: string;
  ratingAvg: number; entryFeeAdult: number | null; visitDurationMin?: number;
  images?: string[];
  district?: { name: string; slug: string } | null;
};

export function DestinationCard({ d }: { d: DestCardData }) {
  return (
    <Link href={`/destinations/${d.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-lift">
        <div className={`relative h-36 bg-gradient-to-br ${gradientFor(d.slug)}`}>
          <Frame
            src={d.images?.[0]}
            alt=""
            fallbackSeed={`destination-${d.slug}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold capitalize text-ink-900">
            {typeLabel(d.type)}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-ink-950 group-hover:text-brand-700">{d.name}</h3>
          {d.district ? <p className="mt-0.5 text-xs text-ink-900/60">{d.district.name} district</p> : null}
          <p className="mt-2 line-clamp-2 text-sm text-ink-900/80">{d.summary}</p>
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-ink-900/70">
            {d.ratingAvg > 0 ? <span>★ {d.ratingAvg.toFixed(1)}</span> : null}
            <span>{d.entryFeeAdult ? `Entry ${formatINR(d.entryFeeAdult)}` : "Free entry"}</span>
            {d.visitDurationMin ? <span>~{formatMinutes(d.visitDurationMin)}</span> : null}
          </p>
        </div>
      </Card>
    </Link>
  );
}

type EventCardData = {
  slug: string; title: string; category: string; description?: string | null;
  startDate: Date | string; endDate: Date | string; venueName?: string | null;
  district?: { name: string; slug: string } | null;
};

export function EventCard({ e }: { e: EventCardData }) {
  const s = new Date(e.startDate);
  const en = new Date(e.endDate);
  const sameMonth = s.getMonth() === en.getMonth() && s.getFullYear() === en.getFullYear();
  return (
    <Link href={`/events/${e.slug}`} className="group block h-full">
      <Card className="flex h-full gap-4 p-4 transition-shadow group-hover:shadow-lift">
        <div className={`grid w-16 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${gradientFor(e.slug)} text-white`}>
          <div className="text-center leading-tight">
            <p className="text-lg font-bold">{s.getDate()}</p>
            <p className="text-[10px] uppercase tracking-wide">{s.toLocaleString("en-IN", { month: "short" })}</p>
          </div>
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold text-ink-950 group-hover:text-brand-700">{e.title}</h3>
          <p className="mt-0.5 text-xs text-ink-900/60">
            {formatDate(s)}{sameMonth ? "" : ` – ${formatDate(en)}`} · {e.venueName ?? e.district?.name}
          </p>
          {e.description ? <p className="mt-2 line-clamp-2 text-sm text-ink-900/80">{e.description}</p> : null}
          <p className="mt-2 inline-flex rounded-full bg-sand-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-900/70">
            {typeLabel(e.category)}
          </p>
        </div>
      </Card>
    </Link>
  );
}

type StayCardData = {
  slug: string; name: string; type: string; address?: string | string[];
  pricePerNightMin: number; pricePerNightMax: number; priceLevel: string;
  ratingAvg: number; verification?: string; images?: string[];
  amenities?: string[]; distanceKm?: number;
  district?: { name: string; slug: string } | null;
};

export function StayCard({ s }: { s: StayCardData }) {
  return (
    <Link href={`/stays/${s.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-lift">
        <div className={`relative h-28 bg-gradient-to-br ${gradientFor(s.slug)}`}>
          <Frame
            src={s.images?.[0]}
            alt=""
            fallbackSeed={`stay-${s.slug}`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="h-full w-full [&>img]:transition-transform [&>img]:duration-500 group-hover:[&>img]:scale-105"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-4 left-4 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold capitalize text-ink-900">
            {typeLabel(s.type)}
          </span>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-ink-950 group-hover:text-brand-700">{s.name}</h3>
            {s.verification === "VERIFIED" ? (
              <span title="Verified by tourism department" className="shrink-0 text-xs font-semibold text-brand-700">✓ Verified</span>
            ) : null}
          </div>
          <p className="mt-0.5 truncate text-xs text-ink-900/60">
            {typeof s.address === "string" ? s.address : (s.address as unknown as { name?: string })?.name ?? ""}
            {s.district ? ` · ${s.district.name}` : ""}
            {s.distanceKm != null ? ` · ${s.distanceKm.toFixed(1)} km away` : ""}
          </p>
          <p className="mt-3 text-sm">
            <span className="font-bold text-ink-950">{formatINR(s.pricePerNightMin)}</span>
            <span className="text-xs text-ink-900/60">–{formatINR(s.pricePerNightMax)} / night</span>
          </p>
          {s.ratingAvg > 0 ? <p className="mt-1 text-xs font-medium text-ink-900/70">★ {s.ratingAvg.toFixed(1)}</p> : null}
        </div>
      </Card>
    </Link>
  );
}

export function Pagination({ page, pageSize, total, basePath }: { page: number; pageSize: number; total: number; basePath: string }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  const link = (p: number) => `${basePath}?page=${p}`;
  return (
    <nav aria-label="Pagination" className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={link(page - 1)} className="rounded-lg border border-sand-200 bg-surface px-3 py-2 text-sm hover:border-brand-300">← Prev</Link>
      ) : null}
      <span className="px-2 text-sm text-ink-900/60">Page {page} of {pages}</span>
      {page < pages ? (
        <Link href={link(page + 1)} className="rounded-lg border border-sand-200 bg-surface px-3 py-2 text-sm hover:border-brand-300">Next →</Link>
      ) : null}
    </nav>
  );
}
