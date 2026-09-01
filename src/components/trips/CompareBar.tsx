"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Scale, X } from "lucide-react";
import { useCompare } from "@/lib/store";
import { TRIPS } from "@/lib/data/trips";

export default function CompareBar() {
  const compare = useCompare();
  const pathname = usePathname();
  if (!compare.ready || compare.slugs.length === 0) return null;
  if (pathname.startsWith("/compare") || pathname.startsWith("/admin")) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[95] px-4 pb-4">
      <div className="fade-up card pointer-events-auto mx-auto flex max-w-2xl items-center gap-3 p-3 shadow-2xl">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pine text-white dark:text-[#0e1512]">
          <Scale size={17} aria-hidden />
        </span>
        <ul className="no-scrollbar flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto">
          {compare.slugs.map((slug) => {
            const trip = TRIPS.find((t) => t.slug === slug);
            if (!trip) return null;
            return (
              <li
                key={slug}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface2 py-1 pl-3 pr-1.5 text-xs font-medium"
              >
                <span className="max-w-36 truncate">{trip.name}</span>
                <button
                  type="button"
                  onClick={() => compare.remove(slug)}
                  aria-label={`Remove ${trip.name} from compare`}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-surface"
                >
                  <X size={12} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
        {compare.slugs.length >= 2 ? (
          <Link href="/compare" className="btn btn-primary shrink-0">
            Compare {compare.slugs.length}
          </Link>
        ) : (
          <span className="shrink-0 pr-1 text-xs text-muted">
            Add {2 - compare.slugs.length} more
          </span>
        )}
      </div>
    </div>
  );
}
