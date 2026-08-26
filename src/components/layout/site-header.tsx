import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { getViewer } from "@/server/auth/guard";
import { signOutAction } from "@/server/actions/auth";

const NAV = [
  { href: "/destinations", label: "Destinations" },
  { href: "/events", label: "Events" },
  { href: "/stays", label: "Stays" },
  { href: "/map", label: "Map" },
  { href: "/emergency", label: "Safety" },
];

export async function SiteHeader() {
  const viewer = await getViewer();
  return (
    <header className="sticky top-0 z-40 border-b border-sand-200 bg-sand-50/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-display text-xl font-bold text-ink-950" aria-label="Sanchari home">
          <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-coast-700 text-white">
            సం
          </span>
          <span className="hidden sm:block">
            Sanchari<span className="text-brand-600">.</span>
          </span>
        </Link>

        <nav aria-label="Primary" className="min-w-0 flex-1">
          <ul className="flex items-center gap-1 overflow-x-auto text-sm font-medium text-ink-900/80 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="whitespace-nowrap rounded-lg px-3 py-2 hover:bg-brand-50 hover:text-brand-800">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <ButtonLink href="/plan" variant="secondary" className="hidden lg:inline-flex !border-brand-300">
            ✨ AI Planner
          </ButtonLink>
          {viewer ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50"
              >
                <span aria-hidden>{viewer.name.slice(0, 1).toUpperCase()}</span>
                <span className="hidden md:inline">{viewer.name.split(" ")[0]}</span>
              </Link>
              <form action={signOutAction}>
                <button type="submit" className="rounded-xl px-2 py-2 text-sm font-medium text-ink-900/60 hover:text-ink-900">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <>
              <ButtonLink href="/plan" className="lg:hidden">Plan</ButtonLink>
              <Link href="/signin" className="rounded-xl px-3 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50">
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
