import { NextResponse } from "next/server";

/**
 * Comprueba si un sitio permite incrustarse en un iframe.
 * BeeFinder, por ejemplo, responde con `x-frame-options: SAMEORIGIN`, así que
 * su tarjeta usa vídeo pregrabado en vez de la mini-ventana en vivo.
 */
export async function GET(request: Request) {
  const target = new URL(request.url).searchParams.get("url");
  if (!target || !/^https?:\/\//.test(target)) {
    return NextResponse.json({ embeddable: false }, { status: 400 });
  }

  let embeddable = false;
  try {
    const res = await fetch(target, {
      redirect: "follow",
      headers: {
        accept: "text/html,application/xhtml+xml",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      },
      next: { revalidate: 86400 },
    });
    await res.body?.cancel();

    if (res.ok) {
      const xfo = (res.headers.get("x-frame-options") ?? "").toLowerCase();
      const csp = (res.headers.get("content-security-policy") ?? "").toLowerCase();
      const ancestors = csp.match(/frame-ancestors([^;]*)/)?.[1]?.trim() ?? null;

      const blockedByXfo = xfo.includes("deny") || xfo.includes("sameorigin");
      // Cualquier frame-ancestors que no sea comodín bloquea el iframe entre dominios.
      const blockedByCsp = ancestors !== null && !ancestors.includes("*");
      embeddable = !blockedByXfo && !blockedByCsp;
    }
  } catch {
    embeddable = false;
  }

  return NextResponse.json(
    { embeddable },
    {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
