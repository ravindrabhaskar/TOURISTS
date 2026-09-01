"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/primitives";
import { formatKm } from "@/lib/geo";
import PageHeader from "@/components/ui/PageHeader";

type Place = {
  name: string; slug: string; type: string; categories?: string[];
  distanceKm: number; ratingAvg?: number; entryFeeAdult?: number | null; href: string;
};
type Stay = { name: string; slug: string; href: string; distanceKm: number };

const RINGS = [10, 25, 50];

export default function NearMePage() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [status, setStatus] = useState<"idle" | "locating" | "ready" | "denied" | "error">("idle");
  const [radius, setRadius] = useState(25);
  const [places, setPlaces] = useState<Place[]>([]);
  const [stays, setStays] = useState<Stay[]>([]);
  const [loading, setLoading] = useState(false);

  const locate = useCallback(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("ready");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    fetch(`/api/v1/near-me?lat=${coords.lat}&lng=${coords.lng}&radiusKm=${radius}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) {
          setPlaces(j.data.places);
          setStays(j.data.stays);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [coords, radius]);

  return (
    <div className="container-x py-10 sm:py-14">
      <PageHeader
        eyebrow="Right now"
        title="Near me"
        sub="Verified places around you. Your location is used only in your browser for this search — it is never stored."
      />

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={locate}
          disabled={status === "locating"}
          className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {status === "locating" ? "Locating…" : coords ? "Refresh location" : "📍 Use my location"}
        </button>
        {coords && status === "ready" ? (
          <div role="group" aria-label="Radius" className="flex overflow-hidden rounded-xl border border-sand-200">
            {RINGS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRadius(r)}
                className={`px-4 py-2 text-sm font-semibold ${radius === r ? "bg-brand-600 text-white" : "bg-surface text-ink-900/70 hover:bg-sand-100"}`}
              >
                Within {r} km
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {status === "denied" || status === "error" ? (
        <Card className="mt-8 p-6">
          <p className="text-sm font-semibold">Location unavailable</p>
          <p className="mt-1 text-sm text-ink-900/70">
            {status === "denied"
              ? "Location permission was denied. You can browse by district instead:"
              : "We couldn't determine your position. Browse by district instead:"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            <Link href="/destinations" className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-800">All destinations</Link>
            <Link href="/map" className="rounded-lg bg-brand-50 px-3 py-1.5 font-medium text-brand-800">Open the map</Link>
          </div>
        </Card>
      ) : null}

      {coords && status === "ready" ? (
        <>
          <p aria-live="polite" className="mt-6 text-xs text-ink-900/60">
            Origin: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            {loading ? " · loading…" : ""}
          </p>

          <section aria-labelledby="nearby-places" className="mt-4">
            <h2 id="nearby-places" className="font-display text-2xl font-semibold">Nearby places</h2>
            {!loading && places.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-sand-300 p-6 text-center text-sm text-ink-900/60">
                Nothing published within {radius} km yet — try a wider radius.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-surface">
                {places.map((p) => (
                  <li key={p.slug}>
                    <Link href={p.href} className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-sand-50">
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{p.name}</span>
                        <span className="block text-xs capitalize text-ink-900/60">
                          {p.type.toLowerCase().replace(/_/g, " ")}
                          {p.ratingAvg && p.ratingAvg > 0 ? ` · ★ ${p.ratingAvg.toFixed(1)}` : ""}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-800">
                        {formatKm(p.distanceKm)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {stays.length > 0 ? (
            <section aria-labelledby="nearby-stays" className="mt-8">
              <h2 id="nearby-stays" className="font-display text-2xl font-semibold">Stays nearby</h2>
              <ul className="mt-3 divide-y divide-sand-100 rounded-2xl border border-sand-200 bg-surface">
                {stays.map((s) => (
                  <li key={s.slug}>
                    <Link href={s.href} className="flex items-center justify-between px-5 py-3.5 hover:bg-sand-50">
                      <span className="truncate font-semibold">🏨 {s.name}</span>
                      <span className="ml-2 shrink-0 text-xs font-bold text-brand-800">{formatKm(s.distanceKm)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
