import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { OgTemplate } from "@/components/seo/og-template";

export const runtime = "edge";

/**
 * Imagen OG del sitio: acepta ?title= y ?subtitle= para que cada página
 * (home, blog, posts) tenga su propia miniatura con la misma identidad.
 */
export async function GET(request: NextRequest) {
  const title =
    request.nextUrl.searchParams.get("title") ||
    "Full-Stack Developer & Software Architect";
  const subtitle =
    request.nextUrl.searchParams.get("subtitle") ||
    "React · Next.js · Node.js · MySQL";

  return new ImageResponse(
    <OgTemplate title={title} subtitle={subtitle} badge="caskiuz.vercel.app" />,
    { width: 1200, height: 630 }
  );
}
