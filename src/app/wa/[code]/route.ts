import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { getSiteConfig } from "@/lib/site-config";
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
 * Link de WhatsApp del afiliado: registra el clic y abre el chat del negocio
 * con el mensaje predefinido + el código de referido ya escrito. Así el
 * cliente escribe por WhatsApp directo (sin pasar por la web) y el código
 * viaja igual en el mensaje.
 * También fija las cookies de atribución por si el cliente vuelve a la web.
 * Ejemplo: /wa/ricardo-agelvis?subid=instagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const subid = request.nextUrl.searchParams.get("subid");

  const headersList = await headers();
  const userAgent = headersList.get("user-agent")?.slice(0, 480) || null;

  // Robots y vistas previas: abren WhatsApp sin registrar clic
  if (isBotRequest(userAgent, headersList)) {
    return NextResponse.redirect(new URL("/", request.url));
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

  const config = await getSiteConfig();
  const phone = (config.contact_whatsapp || "584262931869").replace(/\D/g, "");
  const message = config.contact_whatsapp_message || "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto.";
  const ref = publicRef(affiliate);
  const text = `${message}\n\nCódigo de referido: ${ref}`;

  const response = NextResponse.redirect(
    `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  );
  const visitorId = getOrCreateVisitorId(request, response);

  // Dedup: el mismo visitante re-clicando en 24h no duplica el clic
  const existingClick = await prisma.click.findFirst({
    where: {
      affiliateId: affiliate.id,
      visitorId,
      destination: "whatsapp",
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
          destination: "whatsapp",
          visitorId,
        },
      });

  // Atribución también desde este canal (por si el cliente vuelve a la web)
  setAttributionCookies(response, { affiliateId: affiliate.id, clickId: click.id, ref });

  return response;
}
