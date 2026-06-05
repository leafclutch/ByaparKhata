import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 40,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: -3,
            fontFamily: "sans-serif",
          }}
        >
          HH
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
