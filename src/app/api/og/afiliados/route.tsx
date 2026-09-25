import { ImageResponse } from "next/og";
import { OgTemplate } from "@/components/seo/og-template";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    <OgTemplate
      title="Programa de Afiliados"
      subtitle="Gana hasta 40% de comisión por cada venta"
      badge="UNIRSE ES GRATIS · Pagos en USDT · USDC · BTC"
    />,
    { width: 1200, height: 630 }
  );
}
