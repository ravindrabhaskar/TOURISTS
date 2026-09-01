import { db } from "@/server/db";
import { Card } from "@/components/ui/primitives";
import PageHeader from "@/components/ui/PageHeader";

export const metadata = {
  title: "Emergency & Safety",
  description: "Verified emergency contacts and active safety alerts for travellers in Andhra Pradesh.",
};

export const dynamic = "force-dynamic";

const contactsQuery = () =>
  db.emergencyContact.findMany({
    orderBy: [{ isUniversal: "desc" }, { category: "asc" }],
    include: { district: { select: { name: true } } },
  });
const alertsQuery = () =>
  db.safetyAlert.findMany({
    where: { isActive: true, OR: [{ endsAt: null }, { endsAt: { gte: new Date() } }] },
    orderBy: [{ severity: "desc" }, { startsAt: "desc" }],
    take: 10,
    include: { district: { select: { name: true } } },
  });

export default async function EmergencyPage() {
  let contacts: Awaited<ReturnType<typeof contactsQuery>>;
  let alerts: Awaited<ReturnType<typeof alertsQuery>>;
  try {
    [contacts, alerts] = await Promise.all([contactsQuery(), alertsQuery()]);
  } catch {
    // render static universal numbers regardless
    const now = new Date();
    contacts = [
      { id: "c-112", category: "HELPLINE", name: "National emergency", phone: "112", altPhone: null, address: null, districtId: null, district: null, lat: null, lng: null, isUniversal: true, updatedAt: now },
      { id: "c-108", category: "AMBULANCE", name: "Ambulance", phone: "108", altPhone: null, address: null, districtId: null, district: null, lat: null, lng: null, isUniversal: true, updatedAt: now },
      { id: "c-100", category: "POLICE", name: "Police control room", phone: "100", altPhone: null, address: null, districtId: null, district: null, lat: null, lng: null, isUniversal: true, updatedAt: now },
    ];
    alerts = [];
  }

  const ICONS: Record<string, string> = {
    POLICE: "👮",
    AMBULANCE: "🚑",
    HOSPITAL: "🏥",
    FIRE: "🚒",
    DISASTER: "🌊",
    HELPLINE: "☎️",
    WOMAN_CHILD: "🛡️",
    TOURISM: "🧳",
  };

  return (
    <div className="container-x max-w-4xl py-10 sm:py-14">
      <PageHeader
        eyebrow="Stay safe"
        title="Emergency & safety"
        sub="Official numbers and current advisories. Sanchari never invents alert status — only department-issued alerts appear here."
        className="mb-8"
      />

      {alerts.length > 0 ? (
        <section aria-labelledby="alerts-heading" className="mb-10 space-y-3">
          <h2 id="alerts-heading" className="font-display text-2xl font-bold">Active alerts</h2>
          {alerts.map((a) => (
            <Card key={a.id} className={`border-l-4 p-5 ${a.severity === "CRITICAL" ? "border-l-danger bg-danger/10" : a.severity === "WARNING" ? "border-l-spice-500 bg-spice-50/60" : "border-l-coast-500 bg-coast-100/40"}`}>
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <span aria-hidden>{a.severity === "CRITICAL" ? "🚨" : a.severity === "WARNING" ? "⚠️" : "ℹ️"}</span>
                {a.title}
                {a.district ? <span className="rounded-full bg-surface px-2 py-0.5 text-xs">{a.district.name} district</span> : null}
              </p>
              <p className="mt-1.5 text-sm text-ink-900/80">{a.message}</p>
              <p className="mt-2 text-xs text-ink-900/50">Issued by {a.issuedBy} · from {a.startsAt.toLocaleDateString("en-IN")}{a.endsAt ? ` until ${a.endsAt.toLocaleDateString("en-IN")}` : ""}</p>
            </Card>
          ))}
        </section>
      ) : null}

      <section aria-labelledby="contacts-heading">
        <h2 id="contacts-heading" className="font-display text-2xl font-bold">Emergency contacts</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {contacts.map((c) => (
            <li key={c.id}>
              <Card className="flex items-center gap-4 p-4">
                <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl bg-sand-100 text-xl">
                  {ICONS[c.category] ?? "☎️"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="text-xs capitalize text-ink-900/60">
                    {c.category.toLowerCase()}
                    {c.district ? ` · ${c.district.name}` : ""}
                    {c.isUniversal ? " · nationwide" : ""}
                  </p>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="shrink-0 rounded-xl bg-brand-600 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700"
                >
                  {c.phone}
                </a>
              </Card>
            </li>
          ))}
        </ul>
      </section>

      <Card className="mt-10 p-5 text-sm leading-relaxed text-ink-900/75">
        <h2 className="font-semibold text-ink-950">Traveller safety basics</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Share your itinerary with family; hill and forest areas may have patchy mobile coverage.</li>
          <li>Check district alerts before boat rides, treks and beach swims — obey lifeguard flags.</li>
          <li>Cyclones (Oct–Dec) can close coastal roads; follow APSDMA advisories.</li>
          <li>At temples, follow dress codes and keep valuables in the free lockers provided.</li>
        </ul>
      </Card>
    </div>
  );
}
