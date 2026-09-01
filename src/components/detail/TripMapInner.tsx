"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { TRIP_GEO } from "@/lib/data/geo";
import { useSettings } from "@/lib/store";

export default function TripMapInner({ slug, name }: { slug: string; name: string }) {
  const geo = TRIP_GEO[slug];
  const { theme } = useSettings();

  if (!geo) return null;

  const tiles =
    theme === "dark"
      ? {
          url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        }
      : {
          url: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        };

  return (
    <div className="card overflow-hidden p-0">
      <MapContainer
        center={[geo.lat, geo.lng]}
        zoom={geo.zoom ?? 7}
        scrollWheelZoom={false}
        style={{ height: "20rem", width: "100%" }}
        attributionControl
      >
        <TileLayer url={tiles.url} attribution={tiles.attribution} />
        <CircleMarker
          center={[geo.lat, geo.lng]}
          radius={11}
          pathOptions={{
            color: "rgb(var(--accent))",
            fillColor: "rgb(var(--accent))",
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Tooltip direction="top" offset={[0, -8]} opacity={1}>
            <strong>{name}</strong>
            <br />
            {geo.label}
          </Tooltip>
        </CircleMarker>
      </MapContainer>
      <p className="border-t border-line px-4 py-2.5 font-mono text-xs text-muted">
        {geo.label}
      </p>
    </div>
  );
}
