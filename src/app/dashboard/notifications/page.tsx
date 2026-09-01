import { requireViewer } from "@/server/auth/guard";
import { listNotifications, unreadCount } from "@/server/domains/notifications";
import { markNotificationsReadAction } from "@/server/actions/user";
import { Card } from "@/components/ui/primitives";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

const TYPE_ICONS: Record<string, string> = {
  BOOKING: "🎫",
  TRIP: "🗺️",
  REVIEW: "✍️",
  REWARD: "🏅",
  SYSTEM: "📣",
  ALERT: "🚨",
  PARTNER: "🏨",
};

export default async function NotificationsPage() {
  const viewer = await requireViewer();
  const [items, unread] = await Promise.all([listNotifications(viewer.id, false, 50), unreadCount(viewer.id)]);

  return (
    <div>
      <PageHeader
        compact
        eyebrow="Updates"
        title="Notifications"
        sub={unread > 0 ? `${unread} unread` : "You are all caught up."}
        action={
          unread > 0 ? (
            <form action={markNotificationsReadAction}>
              <button type="submit" className="btn btn-outline">
                Mark all as read
              </button>
            </form>
          ) : null
        }
      />

      {items.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-sand-300 p-10 text-center text-ink-900/60">
          You&apos;re all caught up.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {items.map((n) => (
            <li key={n.id}>
              <Card className={`flex gap-4 p-4 ${!n.readAt ? "border-l-4 !border-l-brand-500" : ""}`}>
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-sand-100 text-lg">
                  {TYPE_ICONS[n.type] ?? "🔔"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!n.readAt ? "font-bold" : "font-semibold"}`}>{n.title}</p>
                  <p className="mt-0.5 text-sm text-ink-900/75">{n.body}</p>
                  <p className="mt-1 text-xs text-ink-900/50">
                    {n.createdAt.toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                {n.linkUrl ? (
                  <a href={n.linkUrl} className="shrink-0 self-center rounded-xl border border-sand-200 px-3 py-1.5 text-xs font-semibold hover:border-brand-300">
                    Open
                  </a>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}

      {/* Bulk form for mark-all (uses unchecked boxes trick) */}
      {unread > 0 ? (
        <form action={markNotificationsReadAction}>
          {items.filter((i) => !i.readAt).map((i) => (
            <input key={i.id} type="hidden" name="ids" value={i.id} />
          ))}
        </form>
      ) : null}
    </div>
  );
}
