"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./destinations-leaflet-map";

export type { MapPoint };

const DestinationsLeafletMap = dynamic(() => import("./destinations-leaflet-map"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[70vh] place-items-center rounded-2xl border border-sand-200 bg-sand-100 text-sm text-ink-900/60">
      Loading map…
    </div>
  ),
});

export function DestinationsMap(props: { points: MapPoint[] }) {
  return <DestinationsLeafletMap {...props} />;
}
