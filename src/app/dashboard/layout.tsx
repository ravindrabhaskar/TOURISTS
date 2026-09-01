import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getViewer } from "@/server/auth/guard";
import DashboardNav from "@/components/layout/dashboard-nav";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/dashboard");

  return (
    <div className="container-x grid gap-8 py-10 lg:grid-cols-[230px_1fr] lg:py-14">
      <aside>
        <div className="rounded-2xl border border-line bg-surface p-4">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
            Signed in as
          </p>
          <p className="mt-1.5 flex items-center gap-2 font-semibold">
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pine font-mono text-xs text-white"
            >
              {viewer.name.slice(0, 1).toUpperCase()}
            </span>
            <span className="min-w-0 truncate">{viewer.name}</span>
          </p>
          <p className="mt-1 text-xs capitalize text-muted">
            {viewer.role.toLowerCase().replace(/_/g, " ")}
          </p>
        </div>
        <DashboardNav role={viewer.role} />
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
