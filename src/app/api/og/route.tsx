import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0a0a0f",
          fontFamily: "Geist, Segoe UI, system-ui, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20px 20px, rgba(108,92,231,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glow */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "50%",
            width: "600px",
            height: "600px",
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(108,92,231,0.12) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            borderRadius: "40px",
            border: "1px solid rgba(108,92,231,0.15)",
          }}
        />

        {/* Code brackets */}
        <div
          style={{
            position: "absolute",
            left: "100px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "120px",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            color: "#6c5ce7",
            opacity: 0.35,
          }}
        >
          {"<"}
        </div>
        <div
          style={{
            position: "absolute",
            right: "100px",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "120px",
            fontFamily: "'Courier New', monospace",
            fontWeight: "bold",
            color: "#00d2ff",
            opacity: 0.35,
          }}
        >
          {">"}
        </div>

        {/* Logo text */}
        <div
          style={{
            display: "flex",
            fontSize: "96px",
            fontWeight: 900,
            letterSpacing: "12px",
            background: "linear-gradient(to right, #6c5ce7, #00d2ff, #6c5ce7)",
            backgroundClip: "text",
            color: "transparent",
            filter: "drop-shadow(0 0 30px rgba(108,92,231,0.5))",
            marginBottom: "20px",
          }}
        >
          CASKIUZ
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: "28px",
            fontWeight: 500,
            letterSpacing: "8px",
            color: "rgba(0,210,255,0.8)",
            filter: "drop-shadow(0 0 10px rgba(0,210,255,0.4))",
          }}
        >
          FULL-STACK DEVELOPER
        </div>

        {/* Code snippet */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            fontSize: "18px",
            fontFamily: "'Courier New', 'Fira Code', monospace",
            color: "rgba(108,92,231,0.4)",
            letterSpacing: "2px",
          }}
        >
          {"const build = (dreams) => reality"}
        </div>

        {/* Pulsing dots */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "100px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#00d2ff",
            boxShadow: "0 0 12px rgba(0,210,255,0.6)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "100px",
            left: "100px",
            width: "10px",
            height: "10px",
            borderRadius: "50%",
            backgroundColor: "#6c5ce7",
            boxShadow: "0 0 12px rgba(108,92,231,0.6)",
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}