import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { isBotRequest } from "@/lib/bot-filter";
import {
  setAttributionCookies,
  getOrCreateVisitorId,
  resolveAffiliateByRef,
  publicRef,
  CLICK_DEDUP_WINDOW_MS,
} from "@/lib/referral-tracking";

export const dynamic = "force-dynamic";

/**
 * Link de referido: registra el clic, fija la cookie de atribución (30 días)
 * y redirige al destino con ?ref=<código> en la URL para que la atribución
 * sobreviva aunque el visitante borre las cookies.
 * Acepta el slug bonito (/r/ricardo-agelvis) o el código legado (/r/XARUX5YH).
 * Ejemplo: /r/ricardo-agelvis?subid=instagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const subid = request.nextUrl.searchParams.get("subid");
  const to = request.nextUrl.searchParams.get("to");

  // Validar destino para evitar open redirects
  const target = String(to || "").startsWith("/") && !String(to).startsWith("//")
    ? String(to)
    : "/#services";

  const headersList = await headers();
  const userAgent = headersList.get("user-agent")?.slice(0, 480) || null;

  // Robots y vistas previas de redes sociales: redirigen sin registrar clic
  if (isBotRequest(userAgent, headersList)) {
    return NextResponse.redirect(new URL(target, request.url));
  }

  const raw = decodeURIComponent(code).trim();
  const affiliate = await resolveAffiliateByRef(raw);

  if (!affiliate || affiliate.status === "SUSPENDED") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const referrer = headersList.get("referer")?.slice(0, 480) || null;

  // El código viaja también en la URL de destino (?ref=): respaldo de atribución
  const ref = publicRef(affiliate);
  const redirectUrl = new URL(target, request.url);
  redirectUrl.searchParams.set("ref", ref);

  const response = NextResponse.redirect(redirectUrl);
  const visitorId = getOrCreateVisitorId(request, response);

  // Dedup: el mismo visitante re-clicando el mismo link en 24h no duplica el clic
  const existingClick = await prisma.click.findFirst({
    where: {
      affiliateId: affiliate.id,
      visitorId,
      createdAt: { gte: new Date(Date.now() - CLICK_DEDUP_WINDOW_MS) },
    },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });

  const click = existingClick
    ? existingClick
    : await prisma.click.create({
        data: {
          affiliateId: affiliate.id,
          subId: subid ? subid.slice(0, 100) : null,
          ip,
          userAgent,
          referrer,
          destination: to || "/#services",
          visitorId,
        },
      });

  // Último clic gana: refrescar la atribución siempre (aunque el clic no se duplique)
  setAttributionCookies(response, { affiliateId: affiliate.id, clickId: click.id, ref });

  return response;
}
