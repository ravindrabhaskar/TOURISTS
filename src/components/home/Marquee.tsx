import { TRIPS } from "@/lib/data/trips";

export default function Marquee() {
  const names = TRIPS.map((t) => t.name.toUpperCase());
  const row = [...names, ...names];

  return (
    <section
      aria-hidden
      className="overflow-hidden border-y border-line bg-surface py-4"
    >
      <div className="animate-marquee flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((n, i) => (
          <span key={i} className="flex items-center gap-8 font-mono text-sm tracking-[0.14em] text-muted">
            {n}
            <svg width="12" height="12" viewBox="0 0 12 12" className="text-accent">
              <path d="M6 0v12M0 6h12" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
        ))}
      </div>
    </section>
  );
}
