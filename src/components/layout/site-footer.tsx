import Link from "next/link";

const FOOTER_LINKS: Array<{ heading: string; links: Array<{ href: string; label: string }> }> = [
  {
    heading: "Explore",
    links: [
      { href: "/destinations", label: "Destinations" },
      { href: "/events", label: "Events & festivals" },
      { href: "/stays", label: "Stays" },
    ],
  },
  {
    heading: "Travel smart",
    links: [
      { href: "/plan", label: "AI trip planner" },
      { href: "/emergency", label: "Emergency contacts" },
      { href: "/alerts", label: "Safety alerts" },
    ],
  },
  {
    heading: "Partners",
    links: [
      { href: "/partner", label: "Partner portal" },
      { href: "/about", label: "About Sanchari" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-sand-200 bg-surface">
      <div className="container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-display text-lg font-bold text-ink-950">Sanchari</p>
          <p className="mt-2 max-w-xs text-sm text-ink-900/70">
            The intelligent tourism companion for Andhra Pradesh — plan, book and explore with confidence.
          </p>
        </div>
        {FOOTER_LINKS.map((group) => (
          <nav key={group.heading} aria-label={group.heading}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-900/60">{group.heading}</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {group.links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-ink-900/80 hover:text-brand-700">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-sand-100 py-4">
        <p className="container text-xs text-ink-900/60">
          © {new Date().getFullYear()} Sanchari · Demo build — payments and availability run in clearly-labelled sandbox mode.
        </p>
      </div>
    </footer>
  );
}
