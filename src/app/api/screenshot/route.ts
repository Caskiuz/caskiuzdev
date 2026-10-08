import { NextResponse } from "next/server";

// La primera generación de una captura puede tardar varios segundos.
// En Vercel Hobby el máximo permitido es 60s.
export const maxDuration = 60;

/**
 * Proxy de capturas de pantalla (Microlink) para las miniaturas de proyectos.
 * La respuesta de Microlink se cachea 24h por URL, así cada sitio en vivo se
 * captura como máximo una vez al día sin importar las visitas.
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target || !/^https?:\/\//.test(target)) {
    return new NextResponse("Parámetro url inválido", { status: 400 });
  }

  try {
    const apiUrl =
      "https://api.microlink.io/?" +
      new URLSearchParams({
        url: target,
        screenshot: "true",
        meta: "false",
        embed: "screenshot.url",
        "screenshot.type": "jpeg",
        "screenshot.quality": "75",
        "viewport.width": "1280",
        "viewport.height": "800",
        "viewport.deviceScaleFactor": "1",
      }).toString();

    const res = await fetch(apiUrl, { next: { revalidate: 86400 } });
    if (!res.ok) {
      return new NextResponse("No se pudo generar la captura", { status: 502 });
    }

    const image = await res.arrayBuffer();
    return new NextResponse(image, {
      headers: {
        "Content-Type": res.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new NextResponse("No se pudo generar la captura", { status: 502 });
  }
}
