import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import { createTripFromPlanAction } from "@/server/actions/planner";

export const metadata = { title: "AI Trip Planner" };
export const dynamic = "force-dynamic";

const INTERESTS = ["temples", "beaches", "heritage", "food", "photography", "wildlife", "nature", "adventure", "culture", "festivals"];

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ place?: string; lat?: string; lng?: string; origin?: string; error?: string }> }) {
  const viewer = await getViewer();
  const sp = await searchParams;
  if (!viewer) redirect(`/signin?next=/plan${sp.place ? `%3Fplace%3D${sp.place}` : ""}`);

  // Pre-fill origin from a destination context when arriving via "Plan around here".
  let preferredSlugs: string[] = sp.place ? [sp.place] : [];
  let originName = sp.origin ?? "";
  let originLat = sp.lat ? Number(sp.lat) : NaN;
  let originLng = sp.lng ? Number(sp.lng) : NaN;

  if (sp.place) {
    const dest = await db.destination.findUnique({ where: { slug: sp.place }, select: { lat: true, lng: true, name: true } }).catch(() => null);
    if (dest && !Number.isFinite(originLat)) {
      originLat = dest.lat;
      originLng = dest.lng;
      if (!originName) originName = dest.name;
    }
  }

  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-4xl font-bold">AI Trip Planner</h1>
      <p className="mt-2 text-ink-900/70">
        The Sanchari engine builds a feasible, day-wise itinerary using real drive times, published opening hours and honest cost estimates — then you can adjust it any time.
      </p>

      {sp.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-spice-50 px-4 py-3 text-sm text-spice-700">{sp.error}</p>
      ) : null}

      <form action={createTripFromPlanAction} className="mt-8 space-y-6">
        <input type="hidden" name="originLat" value={Number.isFinite(originLat) ? String(originLat) : ""} />
        <input type="hidden" name="originLng" value={Number.isFinite(originLng) ? String(originLng) : ""} />
        <input type="hidden" name="preferredSlugs" value={preferredSlugs.join(",")} />

        <fieldset className="rounded-2xl border border-sand-200 bg-white p-6">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-ink-900/60">1 · Where & when</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Starting from
              <input
                name="originName"
                required
                minLength={2}
                defaultValue={originName}
                placeholder="City or town (e.g. Hyderabad)"
                className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5 focus:border-brand-400"
              />
            </label>
            <label className="block text-sm font-medium">
              Start date
              <input
                name="startDate"
                type="date"
                required
                min={new Date().toISOString().slice(0, 10)}
                defaultValue={new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5"
              />
            </label>
          </div>
          {!Number.isFinite(originLat) || !Number.isFinite(originLng) ? (
            <p className="mt-2 rounded-lg bg-sand-100 px-3 py-2 text-xs text-ink-900/60">
              Tip: the engine anchors day plans geographically; exact origin coordinates are optional.
            </p>
          ) : null}
        </fieldset>

        <fieldset className="rounded-2xl border border-sand-200 bg-white p-6">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-ink-900/60">2 · Who is travelling</legend>
          <div className="mt-3 grid grid-cols-3 gap-4">
            {[
              ["adults", "Adults", 2],
              ["children", "Children", 0],
              ["seniors", "Seniors", 0],
            ].map(([name, label, def]) => (
              <label key={name as string} className="block text-sm font-medium">
                {label}
                <input type="number" name={name as string} min={0} max={20} defaultValue={def as number} required={name === "adults"} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5" />
              </label>
            ))}
          </div>
          <label className="mt-4 flex flex-wrap items-center gap-3 text-sm font-medium">
            Accessibility needs
            <span className="flex flex-wrap gap-2 font-normal">
              {["wheelchair", "walking aid", "hearing"].map((n) => (
                <label key={n} className="cursor-pointer rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs has-checked:border-brand-500 has-checked:bg-brand-50">
                  <input type="checkbox" name="accessibilityNeeds" value={n} className="sr-only" />
                  {n}
                </label>
              ))}
            </span>
          </label>
        </fieldset>

        <fieldset className="rounded-2xl border border-sand-200 bg-white p-6">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-ink-900/60">3 · Trip shape</legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Days
              <input type="number" name="days" min={1} max={14} defaultValue={3} required className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5" />
            </label>
            <label className="block text-sm font-medium">
              Pace
              <select name="pace" defaultValue="BALANCED" className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <option value="RELAXED">Relaxed — 2 stops/day</option>
                <option value="BALANCED">Balanced — 3 stops/day</option>
                <option value="PACKED">Packed — 4 stops/day</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Total budget ₹ <span className="font-normal">(optional)</span>
              <input type="number" name="budgetTotal" min={1000} step={500} placeholder="e.g. 30000" className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5" />
            </label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Transport preference
              <select name="transportPreference" defaultValue="ANY" className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <option value="ANY">Any</option>
                <option value="CAR">Own car / taxi</option>
                <option value="BUS">Bus</option>
                <option value="TRAIN">Train</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Stay tier
              <select name="accommodationPref" defaultValue="MID" className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <option value="BUDGET">Budget</option>
                <option value="MID">Mid-range</option>
                <option value="PREMIUM">Premium</option>
                <option value="LUXURY">Luxury</option>
              </select>
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-sand-200 bg-white p-6">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-ink-900/60">4 · Interests</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <label key={i} className="cursor-pointer rounded-full border border-sand-200 bg-white px-3.5 py-2 text-xs font-medium capitalize has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800">
                <input type="checkbox" name="interests" value={i} defaultChecked={(sp.place ? ["temples"] : []).includes(i)} className="sr-only" />
                {i}
              </label>
            ))}
          </div>
        </fieldset>

        {preferredSlugs.length > 0 ? (
          <p className="rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">
            ✨ We&apos;ll prioritise <strong>{sp.place}</strong> in your itinerary.
          </p>
        ) : null}

        <button type="submit" className="w-full rounded-xl bg-brand-600 px-6 py-4 text-base font-bold text-white shadow hover:bg-brand-700 sm:w-auto">
          ✨ Generate my itinerary
        </button>
        <p className="text-xs text-ink-900/50">
          No account needed to browse, but{" "}
          <Link href="/signin?next=/plan" className="font-semibold text-brand-700">sign in</Link>{" "}
          to save and reschedule trips.
        </p>
      </form>
    </div>
  );
}
