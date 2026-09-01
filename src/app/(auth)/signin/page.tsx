import { signInAction } from "@/server/actions/auth";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const sp = await searchParams;
  return (
    <Card className="p-8">
      <h1 className="font-display text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-900/70">Sign in to plan trips, save favourites and manage bookings.</p>
      {sp.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-spice-50 px-4 py-3 text-sm font-medium text-spice-700">
          {sp.error}
        </p>
      ) : null}
      <form action={signInAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={sp.next ?? ""} />
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-sand-200 bg-surface px-3 py-2.5 focus:border-brand-400"
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-sand-200 bg-surface px-3 py-2.5 focus:border-brand-400"
            placeholder="••••••••"
          />
        </label>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-900/70">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-700 hover:text-brand-800">
          Create an account
        </Link>
      </p>
      <div className="mt-6 rounded-xl bg-sand-100 p-4 text-xs text-ink-900/70">
        <p className="font-semibold text-ink-900">Demo accounts (seed data)</p>
        <p className="mt-1">Tourist: demo@sanchari.in · Admin: admin@sanchari.in · Partner: partner@sanchari.in</p>
        <p>Password for all: Password123</p>
      </div>
    </Card>
  );
}
