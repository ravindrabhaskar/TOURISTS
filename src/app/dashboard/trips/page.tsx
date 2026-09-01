import Link from "next/link";
import { requireViewer } from "@/server/auth/guard";
import { listUserTrips } from "@/server/domains/trips/service";
import { deleteTripAction } from "@/server/actions/user";
import { Card } from "@/components/ui/primitives";
import { formatINR, formatDate } from "@/lib/utils";

export const metadata = { title: "My trips" };
export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  PLANNING: "bg-coast-100 text-coast-700",
  CONFIRMED: "bg-brand-100 text-brand-800",
  ONGOING: "bg-spice-100 text-spice-700",
  COMPLETED: "bg-sand-200 text-ink-900/70",
  CANCELLED: "bg-danger/15 text-danger",
};

export default async function TripsPage() {
  const viewer = await requireViewer();
  const trips = await listUserTrips(viewer.id);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">My trips</h1>
        <Link href="/plan" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">✨ New trip</Link>
      </div>

      {trips.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          No trips yet — the planner is one form away.
        </p>
      ) : (
        <ul className="mt-6 space-y-4">
          {trips.map((t) => (
            <li key={t.id}>
              <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 font-semibold">
                    {t.title}
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[t.status] ?? ""}`}>{t.status.toLowerCase()}</span>
                  </p>
                  <p className="mt-0.5 text-sm text-ink-900/70">
                    From {t.originName} · {formatDate(t.startDate)} – {formatDate(t.endDate)} · {t.days} day(s)
                    {t.estimatedCost ? ` · est. ${formatINR(t.estimatedCost)}` : ""}
                  </p>
                  <p className="mt-0.5 text-xs text-ink-900/50">{t._count.days_} day plan(s) · {t._count.bookings} booking(s)</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/dashboard/trips/${t.id}`} className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">Open</Link>
                  {t.shareToken ? (
                    <Link href={`/share/${t.shareToken}`} className="rounded-xl border border-sand-200 px-3 py-2 text-sm font-medium hover:border-brand-300" title="Public share link">🔗</Link>
                  ) : null}
                  <form action={deleteTripAction}>
                    <input type="hidden" name="tripId" value={t.id} />
                    <button type="submit" className="rounded-xl px-3 py-2 text-sm font-medium text-danger hover:bg-danger/10" title="Delete trip">🗑</button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
