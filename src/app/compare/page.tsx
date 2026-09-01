import type { Metadata } from "next";
import Link from "next/link";
import CompareBoard from "@/components/trips/CompareBoard";

export const metadata: Metadata = {
  title: "Compare trips",
  description: "Put up to four Trade Winds trips side by side — price, season, duration and group size.",
};

export default function ComparePage() {
  return (
    <div className="container-x py-10 sm:py-14">
      <header className="max-w-xl">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Side by side
        </p>
        <h1 className="mt-2 font-display text-4xl font-semibold">The honest comparison</h1>
        <p className="mt-3 leading-relaxed text-muted">
          Same data, same season bars, no marketing gloss. The cheapest column is
          highlighted — but read the best-months row before you celebrate.
        </p>
      </header>
      <CompareBoard />
      <Link href="/trips" className="btn btn-outline mt-10 inline-flex">
        Add more trips from the catalogue
      </Link>
    </div>
  );
}
