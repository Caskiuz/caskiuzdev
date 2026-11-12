import { NextRequest, NextResponse } from "next/server";
import { checkAndIncrementAiQuota } from "@/lib/gemini";

export const dynamic = "force-dynamic";

/**
 * Proxy de imágenes generadas con IA vía Pollinations.ai (gratis, sin API key).
 * - Seed determinístico por `seed` param: misma URL → misma imagen (cacheable).
 * - Cache de 1 día en el edge del navegador y en el CDN de Vercel.
 * - Cuota diaria (AiUsage IMAGE) y kill-switch IMAGE_AI_OFF=1.
 * Solo se usa desde la web propia (portadas del blog, fallback de proyectos,
 * generador del admin).
 */
export async function GET(request: NextRequest) {
  if (process.env.IMAGE_AI_OFF === "1") {
    return NextResponse.json({ error: "Generación de imágenes desactivada" }, { status: 503 });
  }

  const prompt = (request.nextUrl.searchParams.get("prompt") || "").slice(0, 400);
  const seed = request.nextUrl.searchParams.get("seed") || "1";
  const width = Math.min(Math.max(Number(request.nextUrl.searchParams.get("w")) || 1200, 256), 1600);
  const height = Math.min(Math.max(Number(request.nextUrl.searchParams.get("h")) || 630, 256), 1600);

  if (!prompt.trim()) {
    return NextResponse.json({ error: "Falta el parámetro prompt" }, { status: 400 });
  }

  const allowed = await checkAndIncrementAiQuota("IMAGE");
  if (!allowed) {
    return NextResponse.json({ error: "Cuota diaria de imágenes alcanzada" }, { status: 429 });
  }

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=${width}&height=${height}&seed=${encodeURIComponent(seed)}&nologo=true&model=flux`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(55000), // Hobby: maxDuration 60
      headers: { Referer: "https://caskiuz.vercel.app" },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "El generador de imágenes no respondió" }, { status: 502 });
    }

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    const buffer = await upstream.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Error generando imagen IA:", error);
    return NextResponse.json({ error: "Error generando la imagen" }, { status: 502 });
  }
}
