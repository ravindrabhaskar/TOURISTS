"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Heart,
  Menu,
  Moon,
  Search,
  Sun,
  X,
  ArrowRight,
} from "lucide-react";
import { TRIPS } from "@/lib/data/trips";
import { useSettings, useShortlist } from "@/lib/store";
import { cn } from "@/lib/cn";

export interface HeaderViewer {
  name: string;
}

const NAV = [
  { href: "/trips", label: "All trips" },
  { href: "/destinations", label: "Destinations" },
  { href: "/stays", label: "Stays" },
  { href: "/events", label: "Events" },
  { href: "/journal", label: "Journal" },
];

interface PaletteItem {
  label: string;
  hint: string;
  href: string;
}

function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const items: PaletteItem[] = useMemo(() => {
    const pages: PaletteItem[] = [
      { label: "All trips", hint: "Browse the full catalogue", href: "/trips" },
      { label: "Destinations", hint: "Places, timings & tickets", href: "/destinations" },
      { label: "Stays", hint: "Homestays, resorts & lodges", href: "/stays" },
      { label: "Events", hint: "Festivals & what's on", href: "/events" },
      { label: "AI trip planner", hint: "Build a day-by-day itinerary", href: "/plan" },
      { label: "Near me", hint: "What's around you right now", href: "/near-me" },
      { label: "Map", hint: "Explore on the map", href: "/map" },
      { label: "Journal", hint: "Field notes & season intel", href: "/journal" },
      { label: "Safety & emergency", hint: "Helplines and advisories", href: "/emergency" },
      { label: "My dashboard", hint: "Trips, bookings & rewards", href: "/dashboard" },
      { label: "Plan a trip", hint: "Enquiry form", href: "/enquire" },
      { label: "Find my enquiry", hint: "Look up by reference", href: "/enquiry" },
      { label: "My shortlist", hint: "Saved trips", href: "/saved" },
      { label: "Operator desk", hint: "Admin dashboard", href: "/admin" },
    ];
    const trips: PaletteItem[] = TRIPS.map((t) => ({
      label: t.name,
      hint: `${t.region} · ${t.days} days`,
      href: `/trips/${t.slug}`,
    }));
    const all = [...pages, ...trips];
    if (!q.trim()) return all.slice(0, 9);
    const needle = q.toLowerCase();
    return all
      .filter((i) => `${i.label} ${i.hint}`.toLowerCase().includes(needle))
      .slice(0, 10);
  }, [q]);

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, items.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && items[idx]) {
        window.location.href = items[idx].href;
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [items, idx, onClose]);

  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-i="${idx}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [idx]);

  return (
    <div
      className="fixed inset-0 z-[130] flex items-start justify-center px-4 pt-[12vh]"
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      <div className="fade-up relative w-full max-w-xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={18} className="shrink-0 text-muted" aria-hidden />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setIdx(0);
            }}
            placeholder="Search trips, regions, pages…"
            aria-label="Search trips and pages"
            className="min-h-14 w-full bg-transparent text-[15px] outline-none placeholder:text-muted"
          />
          <kbd className="rounded-md border border-line px-1.5 py-0.5 font-mono text-[10px] text-muted">
            ESC
          </kbd>
        </div>
        <ul ref={listRef} className="max-h-[46vh] overflow-auto p-2">
          {items.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-muted">
              Nothing matches “{q}”. Try “Ladakh”, “beach” or “safari”.
            </li>
          )}
          {items.map((item, i) => (
            <li key={item.href}>
              <Link
                href={item.href}
                data-i={i}
                onClick={onClose}
                onMouseEnter={() => setIdx(i)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl px-4 py-3",
                  i === idx ? "bg-accent-soft text-ink" : "",
                )}
              >
                <span>
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="block text-xs text-muted">{item.hint}</span>
                </span>
                <ArrowRight
                  size={15}
                  className={cn(
                    "shrink-0",
                    i === idx ? "text-accent" : "text-transparent",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Header() {
  // Resolved on the client so the marketing pages stay statically rendered —
  // reading the session cookie in the root layout would opt every route into
  // dynamic rendering.
  const [viewer, setViewer] = useState<HeaderViewer | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/v1/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (alive && body?.data?.viewer) setViewer(body.data.viewer as HeaderViewer);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { theme, toggleTheme, currency, setCurrency } = useSettings();
  const shortlist = useShortlist();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-[90] border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="container-x flex h-16 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-h-11 items-center gap-2.5"
            aria-label="Sanchari home"
          >
            <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden>
              <circle cx="16" cy="16" r="14" fill="none" stroke="rgb(var(--accent))" strokeWidth="2" />
              <path
                d="M7 13h12a3.5 3.5 0 1 0-3.5-3.5M7 18h16a3.5 3.5 0 1 1-3.5 3.5M7 23h8"
                fill="none"
                stroke="rgb(var(--pine))"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="leading-tight">
              <span className="block font-display text-lg font-semibold">Sanchari</span>
              <span className="hidden whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.22em] text-muted xl:block">
                Hyderabad · since 2011
              </span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden lg:block">
            <ul className="flex items-center gap-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    className={cn(
                      "flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors hover:bg-surface2",
                      pathname === n.href && "text-accent",
                    )}
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1.5">
            <div
              className="hidden overflow-hidden rounded-full border border-line 2xl:flex"
              role="group"
              aria-label="Currency"
            >
              {(["INR", "USD"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  aria-pressed={currency === c}
                  className={cn(
                    "min-h-9 px-2.5 font-mono text-xs font-semibold transition-colors",
                    currency === c
                      ? "bg-ink text-bg"
                      : "text-muted hover:text-ink",
                  )}
                >
                  ₹/{c === "INR" ? "₹" : "$"}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              aria-label="Search (Ctrl+K)"
              title="Search (Ctrl+K)"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface2"
            >
              <Search size={19} />
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface2"
            >
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <Link
              href="/saved"
              aria-label={`Shortlist (${shortlist.slugs.length})`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface2"
            >
              <Heart size={18} className={shortlist.slugs.length ? "fill-accent text-accent" : ""} />
              {shortlist.slugs.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 font-mono text-[10px] font-bold text-white">
                  {shortlist.slugs.length}
                </span>
              )}
            </Link>

            <Link
              href="/plan"
              className="hidden min-h-10 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium text-pine transition-colors hover:bg-surface2 xl:inline-flex"
            >
              AI planner
            </Link>

            {viewer ? (
              <Link
                href="/dashboard"
                aria-label={`Account — ${viewer.name}`}
                className="hidden min-h-10 items-center gap-2 whitespace-nowrap rounded-full border border-line px-3 text-sm font-semibold transition-colors hover:bg-surface2 sm:inline-flex"
              >
                <span
                  aria-hidden
                  className="grid h-6 w-6 place-items-center rounded-full bg-pine font-mono text-[11px] text-white"
                >
                  {viewer.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden md:inline">{viewer.name.split(" ")[0]}</span>
              </Link>
            ) : (
              <Link
                href="/signin"
                className="hidden min-h-10 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-colors hover:bg-surface2 sm:inline-flex"
              >
                Sign in
              </Link>
            )}

            <Link href="/enquire" className="btn btn-primary ml-1 hidden whitespace-nowrap sm:inline-flex">
              Plan a trip
            </Link>

            <button
              type="button"
              onClick={() => setMenuOpen((o) => !o)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label="Menu"
              className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface2 lg:hidden"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav
            id="mobile-menu"
            aria-label="Mobile"
            className="border-t border-line bg-surface lg:hidden"
          >
            <ul className="container-x py-3">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center border-b border-line last:border-0"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              {[
                { href: "/plan", label: "AI trip planner" },
                { href: "/near-me", label: "Near me" },
                { href: "/map", label: "Map" },
                { href: "/emergency", label: "Safety" },
                { href: viewer ? "/dashboard" : "/signin", label: viewer ? "My dashboard" : "Sign in" },
              ].map((n) => (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex min-h-12 items-center border-b border-line text-muted last:border-0"
                  >
                    {n.label}
                  </Link>
                </li>
              ))}
              <li className="pt-3">
                <Link
                  href="/enquire"
                  onClick={() => setMenuOpen(false)}
                  className="btn btn-primary w-full"
                >
                  Plan a trip
                </Link>
              </li>
            </ul>
          </nav>
        )}
      </header>
      {paletteOpen && (
        <CommandPalette onClose={() => setPaletteOpen(false)} />
      )}
    </>
  );
}
