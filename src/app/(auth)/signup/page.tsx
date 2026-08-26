import { signUpAction } from "@/server/actions/auth";
import { Card } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = { title: "Create account" };

const INTERESTS = [
  "temples", "beaches", "heritage", "food", "photography",
  "wildlife", "nature", "adventure", "culture", "festivals",
];

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;
  return (
    <Card className="p-8">
      <h1 className="font-display text-2xl font-bold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-900/70">Free forever. Pick interests to personalise recommendations.</p>
      {sp.error ? (
        <p role="alert" className="mt-4 rounded-xl bg-spice-50 px-4 py-3 text-sm font-medium text-spice-700">
          {sp.error}
        </p>
      ) : null}
      <form action={signUpAction} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">
          Full name
          <input
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 focus:border-brand-400"
          />
        </label>
        <label className="block text-sm font-medium">
          Email
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 focus:border-brand-400"
          />
        </label>
        <label className="block text-sm font-medium">
          Password
          <input
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 focus:border-brand-400"
          />
          <span className="mt-1 block text-xs font-normal text-ink-900/60">At least 8 characters with letters and numbers.</span>
        </label>
        <fieldset>
          <legend className="text-sm font-medium">Interests <span className="font-normal text-ink-900/60">(optional)</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTERESTS.map((i) => (
              <label key={i} className="cursor-pointer rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-medium has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800">
                <input type="checkbox" name="interests" value={i} className="sr-only" />
                {i}
              </label>
            ))}
          </div>
        </fieldset>
        <Button type="submit" className="w-full">Create account</Button>
      </form>
      <p className="mt-5 text-center text-sm text-ink-900/70">
        Already a member?{" "}
        <Link href="/signin" className="font-semibold text-brand-700 hover:text-brand-800">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
