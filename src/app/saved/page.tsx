"use client";

import Link from "next/link";
import { ArrowRight, Heart } from "lucide-react";
import { TRIPS } from "@/lib/data/trips";
import { useShortlist } from "@/lib/store";
import TripCard from "@/components/trips/TripCard";

export default function SavedPage() {
  const shortlist = useShortlist();
  const trips = shortlist.slugs
    .map((s) => TRIPS.find((t) => t.slug === s))
    .filter((t): t is NonNullable<typeof t> => Boolean(t));

  return (
    <div className="container-x py-10 sm:py-14">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
            Your shortlist
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold">
            {trips.length > 0 ? `${trips.length} trip${trips.length > 1 ? "s" : ""} you're circling` : "Nothing saved yet"}
          </h1>
          <p className="mt-3 text-muted">
            {shortlist.synced
              ? "Saved to your account, so this list follows you between devices."
              : "Saved on this device. Sign in and it moves to your account."}{" "}
            Enquire and they travel with the enquiry, so one reply can cover the
            whole debate.
          </p>
        </div>
        {trips.length > 0 && (
          <Link href="/enquire" className="btn btn-primary">
            Enquire about these <ArrowRight size={15} aria-hidden />
          </Link>
        )}
      </header>

      {shortlist.ready && trips.length === 0 ? (
        <div className="mt-12 rounded-3xl border border-dashed border-line px-6 py-20 text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-accent">
            <Heart size={26} aria-hidden />
          </span>
          <p className="mt-5 font-display text-2xl font-semibold">
            The heart button is up there for a reason.
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Save trips as you browse — compare months and budgets here instead of in
            seventeen open tabs.
          </p>
          <Link href="/trips" className="btn btn-primary mt-7">
            Browse the 32 trips
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {trips.map((t) => (
            <TripCard key={t.slug} trip={t} />
          ))}
        </div>
      )}
    </div>
  );
}
