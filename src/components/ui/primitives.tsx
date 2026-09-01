import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-2xl border border-sand-200 bg-surface shadow-card", className)}>{children}</div>;
}

const badgeTones = {
  neutral: "bg-sand-100 text-ink-900",
  brand: "bg-brand-100 text-brand-800",
  spice: "bg-spice-100 text-spice-700",
} as const;

export function Badge({ tone = "neutral", className, children }: { tone?: keyof typeof badgeTones; className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function SectionHeading({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-ink-900/70">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="p-8 text-center">
      <p className="text-3xl">🧭</p>
      <h3 className="mt-2 text-lg font-semibold text-ink-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-900/70">{body}</p>
    </Card>
  );
}
