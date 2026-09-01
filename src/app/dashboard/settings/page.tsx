import { db } from "@/server/db";
import { requireViewer } from "@/server/auth/guard";
import { updateSettingsAction } from "@/server/actions/user";
import { Card } from "@/components/ui/primitives";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const INTERESTS = ["temples", "beaches", "heritage", "food", "photography", "wildlife", "nature", "adventure", "culture", "festivals"];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  const sp = await searchParams;
  const viewer = await requireViewer();
  const user = await db.user.findUniqueOrThrow({ where: { id: viewer.id }, select: { name: true, preferredLanguage: true, travelPace: true, foodPreference: true, interests: true } });

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      {sp.saved ? <p role="status" className="mt-3 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800">Saved ✓</p> : null}
      {sp.error ? <p role="alert" className="mt-3 rounded-xl bg-spice-50 px-4 py-3 text-sm text-spice-700">{sp.error}</p> : null}

      <form action={updateSettingsAction} className="mt-4 max-w-xl space-y-5">
        <Card className="space-y-4 p-6">
          <label className="block text-sm font-medium">
            Display name
            <input name="name" defaultValue={user.name} required minLength={2} maxLength={80} className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5 focus:border-brand-400" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-medium">
              Language
              <select name="preferredLanguage" defaultValue={user.preferredLanguage} className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <option value="en">English</option>
                <option value="te">తెలుగు (Telugu)</option>
                <option value="hi">हिन्दी (Hindi)</option>
              </select>
            </label>
            <label className="block text-sm font-medium">
              Travel pace
              <select name="travelPace" defaultValue={user.travelPace ?? ""} className="mt-1 w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5">
                <option value="">Not set</option>
                <option value="RELAXED">Relaxed</option>
                <option value="BALANCED">Balanced</option>
                <option value="PACKED">Packed</option>
              </select>
            </label>
          </div>
          <label className="block text-sm font-medium">
            Food preference <span className="font-normal text-ink-900/50">(optional)</span>
            <input name="foodPreference" defaultValue={user.foodPreference ?? ""} placeholder="Vegetarian, Jain…" className="mt-1 w-full rounded-xl border border-sand-200 px-3 py-2.5" />
          </label>
        </Card>

        <Card className="p-6">
          <fieldset>
            <legend className="text-sm font-semibold">Interests</legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {INTERESTS.map((i) => (
                <label key={i} className="cursor-pointer rounded-full border border-sand-200 bg-white px-3 py-1.5 text-xs font-medium has-checked:border-brand-500 has-checked:bg-brand-50 has-checked:text-brand-800">
                  <input type="checkbox" name="interests" value={i} defaultChecked={user.interests.includes(i)} className="sr-only" />
                  {i}
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <button type="submit" className="rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">Save settings</button>
      </form>
    </div>
  );
}
