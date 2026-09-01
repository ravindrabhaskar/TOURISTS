import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Page-level header for the platform routes (destinations, stays, events,
 * search…), matching the editorial treatment the catalogue pages use: a mono
 * eyebrow, a display-face title, then supporting copy.
 *
 * SectionHeading stays for headings *within* a page — this is the one at the top.
 */
export default function PageHeader({
  eyebrow,
  title,
  sub,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6",
        className,
      )}
    >
      <div className="max-w-2xl">
        {eyebrow ? (
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-2 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          {title}
        </h1>
        {sub ? (
          <p className="mt-3 text-base leading-relaxed text-muted">{sub}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
