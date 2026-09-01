import { ImageResponse } from "next/og";
import { getMergedTrip } from "@/lib/server/content";
import { primeMonths, MONTHS } from "@/lib/season";
import { formatINR } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trade Winds trip";

export default async function TripOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trip = await getMergedTrip(slug);
  if (!trip) return new ImageResponse(<div>Not found</div>, size);

  const best = primeMonths(trip.season);
  const firstBest = best[0];
  const lastBest = best[best.length - 1];
  const bestLabel =
    firstBest === undefined
      ? "Year-round"
      : firstBest === lastBest
        ? (MONTHS[firstBest] ?? "Year-round")
        : `${MONTHS[firstBest]} – ${MONTHS[lastBest ?? firstBest]}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#faf6ef",
          color: "#211d15",
        }}
      >
        <div
          style={{
            width: 14,
            height: "100%",
            background: "#c4562f",
            display: "flex",
          }}
        />
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: 64,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 26, fontWeight: 600 }}>
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 13,
                  background: "#c4562f",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                }}
              >
                ✳
              </div>
              Trade Winds
            </div>
            <div
              style={{
                background: "#155e56",
                color: "#fff",
                borderRadius: 999,
                padding: "8px 22px",
                fontSize: 22,
              }}
            >
              {trip.region}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1.02 }}>{trip.name}</div>
            <div style={{ fontSize: 30, color: "#6e6555" }}>{trip.blurb}</div>
          </div>

          <div style={{ display: "flex", gap: 56, fontSize: 32 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6e6555", fontSize: 20 }}>Per person</span>
              <strong>{formatINR(trip.priceInr)}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6e6555", fontSize: 20 }}>Duration</span>
              <strong>{trip.days} days</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6e6555", fontSize: 20 }}>Best months</span>
              <strong>{bestLabel}</strong>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ color: "#6e6555", fontSize: 20 }}>Rating</span>
              <strong>★ {trip.rating.toFixed(1)}</strong>
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
