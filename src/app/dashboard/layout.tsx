import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getViewer } from "@/server/auth/guard";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: "🏠" },
  { href: "/dashboard/trips", label: "My trips", icon: "🗺️" },
  { href: "/dashboard/bookings", label: "Bookings", icon: "🎫" },
  { href: "/dashboard/favorites", label: "Favourites", icon: "♥" },
  { href: "/dashboard/rewards", label: "Rewards", icon: "🏅" },
  { href: "/dashboard/notifications", label: "Notifications", icon: "🔔" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/dashboard");

  return (
    <div className="container grid gap-8 py-10 lg:grid-cols-[230px_1fr]">
      <aside>
        <p className="px-3 text-xs font-bold uppercase tracking-widest text-ink-900/40">Signed in as</p>
        <p className="mt-1 px-3 font-semibold">{viewer.name}</p>
        <p className="px-3 text-xs capitalize text-ink-900/60">{viewer.role.toLowerCase().replace(/_/g, " ")}</p>
        <nav aria-label="Dashboard" className="mt-5 lg:sticky lg:top-24">
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {LINKS.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-brand-50 hover:text-brand-800">
                  <span aria-hidden>{l.icon}</span> {l.label}
                </Link>
              </li>
            ))}
          </ul>
          {(viewer.role === "PARTNER" || ["TOURISM_ADMIN", "SUPER_ADMIN"].includes(viewer.role)) && (
            <div className="mt-4 border-t border-sand-200 pt-4">
              <Link href="/partner" className="block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-spice-50">🏨 Partner portal</Link>
            </div>
          )}
          {["EDITOR", "MODERATOR", "DISTRICT_ADMIN", "TOURISM_ADMIN", "SUPER_ADMIN"].includes(viewer.role) && (
            <Link href="/admin" className="mt-1 block rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-spice-50">🛡️ Admin portal</Link>
          )}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
