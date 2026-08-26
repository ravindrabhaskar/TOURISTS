"use client";

import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";

export type MapPoint = {
  slug: string;
  name: string;
  type: string;
  districtName?: string;
  lat: number;
  lng: number;
};

function FitBounds({ points }: { points: MapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0]!.lat, points[0]!.lng], 11);
    } else if (points.length > 1) {
      map.fitBounds(points.map((p) => [p.lat, p.lng] as [number, number]), { padding: [40, 40] });
    }
  }, [map, points]);
  return null;
}

export default function DestinationsLeafletMap({
  points,
  center = [15.9, 79.5],
  zoom = 7,
}: {
  points: MapPoint[];
  center?: [number, number];
  zoom?: number;
}) {
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      className="h-[70vh] w-full rounded-2xl border border-sand-200 z-0"
      attributionControl
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {points.map((p) => (
        <CircleMarker
          key={p.slug}
          center={[p.lat, p.lng]}
          radius={7}
          pathOptions={{ color: "#177C64", fillColor: "#46B294", fillOpacity: 0.85 }}
        >
          <Popup>
            <a href={`/destinations/${p.slug}`} className="font-semibold text-brand-700">
              {p.name}
            </a>
            <br />
            <span className="text-xs capitalize text-gray-600">{p.type.toLowerCase().replace(/_/g, " ")}{p.districtName ? ` · ${p.districtName}` : ""}</span>
          </Popup>
        </CircleMarker>
      ))}
      <FitBounds points={points} />
    </MapContainer>
  );
}
