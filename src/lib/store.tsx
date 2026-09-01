"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { TRIPS } from "@/lib/data/trips";

type Theme = "light" | "dark";
type Currency = "INR" | "USD";

interface SettingsCtx {
  theme: Theme;
  toggleTheme: () => void;
  currency: Currency;
  setCurrency: (c: Currency) => void;
}

const SettingsContext = createContext<SettingsCtx | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");
  const [currency, setCurrency] = useState<Currency>("INR");

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const t = (localStorage.getItem("tw-theme") as Theme) || "light";
      const c = (localStorage.getItem("tw-currency") as Currency) || "INR";
      setTheme(t);
      setCurrency(c);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "light" ? "dark" : "light";
      localStorage.setItem("tw-theme", next);
      return next;
    });
  }, []);

  const changeCurrency = useCallback((c: Currency) => {
    setCurrency(c);
    localStorage.setItem("tw-currency", c);
  }, []);

  return (
    <SettingsContext.Provider
      value={{ theme, toggleTheme, currency, setCurrency: changeCurrency }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsCtx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings outside provider");
  return ctx;
}

interface Toast {
  id: number;
  message: string;
  tone: "ok" | "info" | "warn";
}

const ToastContext = createContext<{ push: (m: string, tone?: Toast["tone"]) => void } | null>(
  null,
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);

  const push = useCallback((message: string, tone: Toast["tone"] = "ok") => {
    const id = ++idRef.current;
    setToasts((ts) => [...ts, { id, message, tone }]);
    setTimeout(() => setToasts((ts) => ts.filter((t) => t.id !== id)), 4200);
  }, []);

  return (
    <ToastContext.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[120] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`toast-in pointer-events-auto rounded-xl border px-4 py-3 text-sm shadow-lg ${
              t.tone === "ok"
                ? "border-ok/40 bg-surface text-ink"
                : t.tone === "warn"
                  ? "border-danger/40 bg-surface text-ink"
                  : "border-line bg-surface text-ink"
            }`}
          >
            <span
              className={`mr-2 inline-block h-2 w-2 rounded-full ${
                t.tone === "ok"
                  ? "bg-ok"
                  : t.tone === "warn"
                    ? "bg-danger"
                    : "bg-accent"
              }`}
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast outside provider");
  return ctx;
}

interface ShortlistCtx {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  clear: () => void;
  ready: boolean;
  /** True once the list is backed by the signed-in account rather than this device. */
  synced: boolean;
}

const ShortlistContext = createContext<ShortlistCtx | null>(null);

export function ShortlistProvider({ children }: { children: ReactNode }) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [synced, setSynced] = useState(false);

  // Read the device list first so the UI is correct immediately, then merge it
  // into the account. Signed out, the POST returns slugs:null and we stay local.
  useEffect(() => {
    let alive = true;
    let local: string[] = [];
    try {
      const raw = localStorage.getItem("tw-shortlist");
      if (raw) local = JSON.parse(raw);
    } catch {}
    if (local.length > 0) setSlugs(local);
    setReady(true);

    fetch("/api/v1/shortlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slugs: local }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        const merged: string[] | null = body?.data?.slugs ?? null;
        if (!alive || merged === null) return;
        setSynced(true);
        setSlugs(merged);
        try {
          localStorage.setItem("tw-shortlist", JSON.stringify(merged));
        } catch {}
      })
      .catch(() => {});

    return () => {
      alive = false;
    };
  }, []);

  // localStorage stays the source of truth for signed-out visitors and doubles
  // as an offline cache for signed-in ones, so it is always written.
  const persist = (next: string[]) => {
    setSlugs(next);
    try {
      localStorage.setItem("tw-shortlist", JSON.stringify(next));
    } catch {}
  };

  const push = (slug: string, action: "add" | "remove") => {
    if (!synced) return;
    fetch("/api/v1/shortlist", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, action }),
    }).catch(() => {});
  };

  const value = useMemo<ShortlistCtx>(
    () => ({
      slugs,
      ready,
      synced,
      has: (slug) => slugs.includes(slug),
      toggle: (slug) => {
        const had = slugs.includes(slug);
        persist(had ? slugs.filter((s) => s !== slug) : [...slugs, slug]);
        push(slug, had ? "remove" : "add");
      },
      clear: () => {
        for (const slug of slugs) push(slug, "remove");
        persist([]);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slugs, ready, synced],
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist() {
  const ctx = useContext(ShortlistContext);
  if (!ctx) throw new Error("useShortlist outside provider");
  return ctx;
}

export const COMPARE_CAP = 4;

interface CompareCtx {
  slugs: string[];
  has: (slug: string) => boolean;
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
  clear: () => void;
  ready: boolean;
}

const CompareContext = createContext<CompareCtx | null>(null);

export function CompareProvider({
  children,
  onCap,
}: {
  children: ReactNode;
  onCap?: () => void;
}) {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const capRef = useRef(onCap);

  useEffect(() => {
    capRef.current = onCap;
  }, [onCap]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        const raw = localStorage.getItem("tw-compare");
        if (raw) setSlugs(JSON.parse(raw));
      } catch {}
      setReady(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const persist = (next: string[]) => {
    setSlugs(next);
    localStorage.setItem("tw-compare", JSON.stringify(next));
  };

  const value = useMemo<CompareCtx>(
    () => ({
      slugs,
      ready,
      has: (slug) => slugs.includes(slug),
      remove: (slug) => persist(slugs.filter((s) => s !== slug)),
      clear: () => persist([]),
      toggle: (slug) => {
        if (slugs.includes(slug)) {
          persist(slugs.filter((s) => s !== slug));
        } else if (slugs.length >= COMPARE_CAP) {
          capRef.current?.();
        } else if (TRIPS.some((t) => t.slug === slug)) {
          persist([...slugs, slug]);
        }
      },
    }),
    [slugs, ready],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

export function useCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare outside provider");
  return ctx;
}
