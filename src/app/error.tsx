"use client";

import { Button } from "@/components/ui/button";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x flex flex-col items-center py-24 text-center">
      <p className="text-5xl">🌧️</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">Monsoon in the machinery</h1>
      <p className="mt-2 max-w-md text-sm text-ink-900/70">
        Something went wrong on our side. The issue was logged — please try again.
      </p>
      <Button className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}
