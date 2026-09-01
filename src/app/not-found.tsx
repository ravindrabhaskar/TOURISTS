import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="text-5xl">🧭</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">This trail doesn&apos;t exist</h1>
      <p className="mt-2 max-w-md text-sm text-ink-900/70">
        The page you were looking for may have moved. Head back and keep exploring Andhra Pradesh.
      </p>
      <div className="mt-6 flex gap-3">
        <ButtonLink href="/">Back home</ButtonLink>
        <ButtonLink href="/destinations" variant="secondary">
          Browse destinations
        </ButtonLink>
      </div>
    </div>
  );
}
