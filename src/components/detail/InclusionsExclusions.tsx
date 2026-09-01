import { Check, Minus } from "lucide-react";
import type { Trip } from "@/lib/types";

const BASE_INCLUSIONS = [
  "All stays — handpicked hotels, camps or homestays",
  "Ground transport and internal transfers",
  "Permits, entries and park fees listed in the itinerary",
  "Trip leader from Hyderabad + local guides",
  "Listed meals; every breakfast included",
];

const BASE_EXCLUSIONS = [
  "Flights to and from India (quoted separately)",
  "Travel insurance — mandatory, we help you pick",
  "Personal expenses, tips and anything not listed",
];

export default function InclusionsExclusions({ trip }: { trip: Trip }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-pine/30 bg-pine-soft/50 p-6 dark:bg-pine-soft/20">
        <h3 className="font-display text-lg font-semibold text-pine">What&apos;s in</h3>
        <ul className="mt-4 space-y-2.5 text-sm">
          {[...BASE_INCLUSIONS, `GST at ${trip.country === "India" ? "5%" : "applicable rates"}`].map(
            (item) => (
              <li key={item} className="flex gap-2.5">
                <Check size={16} className="mt-0.5 shrink-0 text-ok" aria-hidden />
                <span>{item}</span>
              </li>
            ),
          )}
        </ul>
      </div>
      <div className="rounded-2xl border border-line bg-surface p-6">
        <h3 className="font-display text-lg font-semibold">What&apos;s not</h3>
        <ul className="mt-4 space-y-2.5 text-sm">
          {BASE_EXCLUSIONS.map((item) => (
            <li key={item} className="flex gap-2.5">
              <Minus size={16} className="mt-0.5 shrink-0 text-danger" aria-hidden />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
