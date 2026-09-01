import { notFound, redirect } from "next/navigation";
import { db } from "@/server/db";
import { getViewer } from "@/server/auth/guard";
import { createStayBookingAction } from "@/server/actions/bookings";
import { Card } from "@/components/ui/primitives";
import { formatINR } from "@/lib/utils";

export const metadata = { title: "Book your stay" };

function defaultCheckIn(): string {
  const d = new Date(Date.now() + 7 * 86400000);
  return d.toISOString().slice(0, 10);
}

export default async function StayCheckoutPage({ searchParams }: { searchParams: Promise<{ roomId?: string; slug?: string }> }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/stays");

  const sp = await searchParams;
  if (!sp.roomId || !sp.slug) notFound();

  const room = await db.room.findUnique({ where: { id: sp.roomId }, include: { stay: true } });
  if (!room || room.stay.slug !== sp.slug) notFound();

  return (
    <div className="container-x max-w-lg py-12">
      <Card className="p-8">
        <h1 className="font-display text-2xl font-semibold">Book your stay</h1>
        <p className="mt-1 text-sm text-ink-900/70">
          {room.stay.name} — {room.name}
        </p>

        <form action={createStayBookingAction} className="mt-6 space-y-4">
          <input type="hidden" name="roomId" value={room.id} />
          <input type="hidden" name="slug" value={sp.slug} />
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Check-in
              <input
                name="checkIn"
                type="date"
                required
                defaultValue={defaultCheckIn()}
                min={new Date().toISOString().slice(0, 10)}
                className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5 focus:border-brand-400"
              />
            </label>
            <label className="block text-sm font-medium">
              Nights
              <select name="nights" defaultValue={2} className="field mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Guests (max {room.capacity})
            <input
              name="guests"
              type="number"
              min={1}
              max={room.capacity}
              defaultValue={Math.min(2, room.capacity)}
              className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5"
            />
          </label>

          <p className="rounded-xl bg-sand-100 p-4 text-sm">
            <span aria-hidden>💰</span>{" "}
            <strong>{formatINR(room.basePrice)}</strong> per night · total shown at sandbox checkout.
          </p>

          <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">
            Continue to payment →
          </button>
          <p className="text-center text-xs text-ink-900/50">Sandbox booking — no charge until the gateway is live.</p>
        </form>
      </Card>
    </div>
  );
}
