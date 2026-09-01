"use client";

import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone, Wind } from "lucide-react";
import { useState } from "react";
import { REGIONS } from "@/lib/types";
import { SITE } from "@/lib/data/site";
import { useToast } from "@/lib/store";

export default function Footer() {
  const { push } = useToast();
  const [email, setEmail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      push("That email doesn't look right yet.", "warn");
      return;
    }
    push("You're on the seasonal letter. One email a month, honest ones.");
    setEmail("");
  };

  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr_1.1fr]">
        <div>
          <p className="flex items-center gap-2 font-display text-xl font-semibold">
            <Wind size={20} className="text-accent" aria-hidden />
            {SITE.name}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted">
            Thirty-two small-group trips run in-house from Hyderabad since{" "}
            {SITE.since}. We tell you the month to go before we tell you the price.
          </p>
          <p className="mt-4 font-mono text-xs text-muted">{SITE.coords}</p>
        </div>

        <nav aria-label="Explore">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Explore
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-accent" href="/trips">All trips</Link></li>
            <li><Link className="hover:text-accent" href="/#collections">Collections</Link></li>
            <li><Link className="hover:text-accent" href="/enquire">Plan a trip</Link></li>
            <li><Link className="hover:text-accent" href="/enquiry">Find my enquiry</Link></li>
            <li><Link className="hover:text-accent" href="/saved">Shortlist</Link></li>
            <li><Link className="hover:text-accent" href="/journal">Journal</Link></li>
          </ul>
        </nav>

        <nav aria-label="Travel tools">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Travel tools
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link className="hover:text-accent" href="/plan">AI trip planner</Link></li>
            <li><Link className="hover:text-accent" href="/destinations">Destinations</Link></li>
            <li><Link className="hover:text-accent" href="/stays">Stays</Link></li>
            <li><Link className="hover:text-accent" href="/events">Events &amp; festivals</Link></li>
            <li><Link className="hover:text-accent" href="/near-me">Near me</Link></li>
            <li><Link className="hover:text-accent" href="/map">Map</Link></li>
            <li><Link className="hover:text-accent" href="/emergency">Safety &amp; helplines</Link></li>
          </ul>
        </nav>

        <nav aria-label="Regions">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Where we go
          </p>
          <ul className="mt-4 space-y-2.5 text-sm">
            {REGIONS.map((r) => (
              <li key={r}>
                <Link className="hover:text-accent" href={`/trips?region=${encodeURIComponent(r)}`}>
                  {r}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
            Talk to a planner
          </p>
          <address className="mt-4 space-y-2.5 text-sm not-italic">
            <p className="flex items-start gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              {SITE.address}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={16} className="shrink-0 text-accent" aria-hidden />
              <a className="hover:text-accent" href={`tel:${SITE.phone.replace(/\s/g, "")}`}>
                {SITE.phone}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <MessageCircle size={16} className="shrink-0 text-accent" aria-hidden />
              <a className="hover:text-accent" href="#">
                WhatsApp {SITE.whatsapp}
              </a>
            </p>
            <p className="flex items-center gap-2">
              <Mail size={16} className="shrink-0 text-accent" aria-hidden />
              <a className="hover:text-accent" href={`mailto:${SITE.email}`}>
                {SITE.email}
              </a>
            </p>
          </address>

          <form onSubmit={subscribe} className="mt-5">
            <label htmlFor="nl-email" className="text-sm font-medium">
              The seasonal letter
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="nl-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field min-h-11 flex-1"
                autoComplete="email"
              />
              <button type="submit" className="btn btn-pine shrink-0">
                Join
              </button>
            </div>
            <p className="mt-2 text-xs text-muted">
              Where to go this month, once a month. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <p>© 2026 Sanchari Travel Co. All trips operated in-house.</p>
          <p>
            Design rebuild · data lives in your browser for this demo ·{" "}
            <Link href="/admin" className="underline hover:text-accent">
              operator desk
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
