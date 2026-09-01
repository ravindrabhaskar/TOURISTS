import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Trade Winds Travel Co. — small-group trips from Hyderabad";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#155e56",
          padding: 72,
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#c4562f",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
            }}
          >
            ✳
          </div>
          <div style={{ fontSize: 34, fontWeight: 600 }}>Trade Winds Travel Co.</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 700 }}>
            The right month makes the right trip.
          </div>
          <div style={{ fontSize: 32, opacity: 0.85 }}>
            32 small-group journeys · honest season data · Hyderabad since 2011
          </div>
        </div>

        <div style={{ display: "flex", gap: 40, fontSize: 28, opacity: 0.9 }}>
          <div>Himalaya</div>
          <div>South India</div>
          <div>Southeast Asia</div>
          <div>Africa</div>
          <div>Europe</div>
        </div>
      </div>
    ),
    size,
  );
}
