import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container flex min-h-[80vh] items-center justify-center py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-display text-2xl font-bold text-ink-950" aria-label="Sanchari home">
            <span aria-hidden className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-coast-700 text-white">
              సం
            </span>
            Sanchari
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
