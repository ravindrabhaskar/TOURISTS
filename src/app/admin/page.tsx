import type { Metadata } from "next";
import { hasAdminSession } from "@/lib/server/session";
import { seedIfEmpty, listEnquiries } from "@/lib/server/db";
import { readOverrides } from "@/lib/server/content";
import { TRIPS } from "@/lib/data/trips";
import AdminLogin from "@/components/admin/AdminLogin";
import Desk from "@/components/admin/Desk";

export const metadata: Metadata = {
  title: "Operator desk",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authed = await hasAdminSession();
  if (!authed) {
    return <AdminLogin hint={process.env.ADMIN_PASSWORD ? undefined : "trade-winds"} />;
  }
  await seedIfEmpty();
  const [records, overrides] = await Promise.all([listEnquiries(), readOverrides()]);
  const studioTrips = TRIPS.map((t) => ({
    slug: t.slug,
    name: t.name,
    region: t.region,
    basePriceInr: t.priceInr,
    baseBlurb: t.blurb,
    priceInr: overrides[t.slug]?.priceInr ?? t.priceInr,
    blurb: overrides[t.slug]?.blurb ?? t.blurb,
    hidden: overrides[t.slug]?.hidden ?? false,
    overridden: Object.keys(overrides[t.slug] ?? {}).length > 0,
  }));
  return <Desk records={records} studioTrips={studioTrips} />;
}

