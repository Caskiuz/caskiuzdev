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
          overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20px 20px, rgba(59,130,246,0.08) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Radial glows azules */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "20%",
            width: "500px",
            height: "500px",
            background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "15%",
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Anillo metálico decorativo */}
        <div
          style={{
            position: "absolute",
            right: "120px",
            top: "50%",
            transform: "translateY(-50%)",
            width: "280px",
            height: "280px",
            borderRadius: "50%",
            border: "14px solid #9aa7b8",
            boxShadow:
              "0 0 60px rgba(56,189,248,0.35), inset 0 0 40px rgba(148,163,184,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              fontSize: "140px",
              fontWeight: 900,
              background: "linear-gradient(135deg, #f8fafc, #9aa7b8 50%, #64748b)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            C
          </div>
        </div>

        {/* Border */}
        <div
          style={{
            position: "absolute",
            inset: "24px",
            borderRadius: "40px",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        />

        {/* Título */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            width: "100%",
            paddingLeft: "100px",
          }}
        >
          <div
            style={{
              fontSize: "84px",
              fontWeight: 900,
              letterSpacing: "6px",
              background: "linear-gradient(110deg, #f8fafc, #9aa7b8 45%, #64748b 70%, #e2e8f0)",
              backgroundClip: "text",
              color: "transparent",
              marginBottom: "12px",
            }}
          >
            AFFILIATES
          </div>
          <div
            style={{
              fontSize: "34px",
              fontWeight: 600,
              color: "#38bdf8",
              letterSpacing: "2px",
              marginBottom: "8px",
            }}
          >
            GANA HASTA 40% DE COMISIÓN
          </div>
          <div
            style={{
              fontSize: "20px",
              color: "#8888a0",
              letterSpacing: "1px",
            }}
          >
            Pagos en USDT · USDC · BTC · Binance Pay
          </div>
        </div>

        {/* Badge gratis */}
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            left: "100px",
            display: "flex",
            padding: "10px 22px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #1e3a8a, #0ea5e9)",
            color: "#ffffff",
            fontSize: "20px",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          UNIRSE ES GRATIS
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
