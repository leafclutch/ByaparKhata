import { ImageResponse } from "next/og";

export const runtime = "edge";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 108,
        }}
      >
        <span
          style={{
            color: "#ffffff",
            fontSize: 192,
            fontWeight: 900,
            letterSpacing: -8,
            fontFamily: "sans-serif",
          }}
        >
          HH
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
