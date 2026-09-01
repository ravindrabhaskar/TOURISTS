import type { Metadata } from "next";
import { hasAdminSession } from "@/lib/server/session";
import { getViewer } from "@/server/auth/guard";
import { can } from "@/server/auth/rbac";
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
  // Two ways in: a platform account carrying admin.dashboard, or the shared
  // desk password for planners who have no platform account. Previously only
  // the password worked, so signed-in admins were asked to log in twice.
  const [deskSession, viewer] = await Promise.all([hasAdminSession(), getViewer()]);
  const authed = deskSession || can(viewer?.role, "admin.dashboard");
  if (!authed) {
    return <AdminLogin hint={process.env.ADMIN_PASSWORD ? undefined : "sanchari"} />;
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

