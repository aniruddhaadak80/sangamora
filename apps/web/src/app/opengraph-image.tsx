import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#160919",
          color: "#FFF6E8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, color: "#0E7C7B", letterSpacing: 4 }}>संगम · sangamora</div>
        <div style={{ display: "flex", fontSize: 72, fontWeight: 700, marginTop: 16, lineHeight: 1.05 }}>
          The widest experience <span style={{ color: "#FF8A00" }}>one prompt</span> can build.
        </div>
        <div style={{ display: "flex", fontSize: 24, marginTop: 24, color: "#FFF6E8", opacity: 0.7 }}>
          5.2M pilgrims · 24 sectors · 54 edges · 3 shahi snan · zero API keys
        </div>
      </div>
    ),
    size,
  );
}