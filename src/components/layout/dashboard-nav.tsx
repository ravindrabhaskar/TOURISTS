"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Heart,
  Home,
  Map,
  Medal,
  Settings,
  Shield,
  Ticket,
  Building2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/dashboard", label: "Overview", icon: Home },
  { href: "/dashboard/trips", label: "My trips", icon: Map },
  { href: "/dashboard/bookings", label: "Bookings", icon: Ticket },
  { href: "/dashboard/favorites", label: "Favourites", icon: Heart },
  { href: "/dashboard/rewards", label: "Rewards", icon: Medal },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

/**
 * Dashboard sidebar. Client-side so the current section can be highlighted —
 * previously every link rendered identically and gave no sense of place.
 */
export default function DashboardNav({ role }: { role: string }) {
  const pathname = usePathname();
  const isPartner = role === "PARTNER" || ["TOURISM_ADMIN", "SUPER_ADMIN"].includes(role);
  const isStaff = ["EDITOR", "MODERATOR", "DISTRICT_ADMIN", "TOURISM_ADMIN", "SUPER_ADMIN"].includes(role);

  return (
    <nav aria-label="Dashboard" className="mt-5 lg:sticky lg:top-24">
      <ul className="no-scrollbar flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
        {LINKS.map((l) => {
          // Overview would otherwise match every nested dashboard route.
          const active = l.href === "/dashboard" ? pathname === l.href : pathname.startsWith(l.href);
          const Icon = l.icon;
          return (
            <li key={l.href}>
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-pine-soft text-pine"
                    : "text-ink/75 hover:bg-surface2 hover:text-ink",
                )}
              >
                <Icon size={17} aria-hidden />
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {(isPartner || isStaff) && (
        <div className="mt-4 space-y-1 border-t border-line pt-4">
          {isPartner && (
            <Link
              href="/partner"
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-ink/75 transition-colors hover:bg-surface2 hover:text-ink"
            >
              <Building2 size={17} aria-hidden /> Partner portal
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              className="flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium text-ink/75 transition-colors hover:bg-surface2 hover:text-ink"
            >
              <Shield size={17} aria-hidden /> Operator desk
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
