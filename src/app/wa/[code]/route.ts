import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import { getSiteConfig } from "@/lib/site-config";
import { affiliateRef } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

/**
 * Link de WhatsApp del afiliado: registra el clic y abre el chat del negocio
 * con el mensaje predefinido + el código de referido ya escrito. Así el
 * cliente escribe por WhatsApp directo (sin pasar por la web) y el código
 * viaja igual en el mensaje.
 * Ejemplo: /wa/ricardo-agelvis?subid=instagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const subid = request.nextUrl.searchParams.get("subid");

  const raw = decodeURIComponent(code).trim();
  const affiliate =
    (await prisma.affiliate.findFirst({ where: { slug: raw.toLowerCase() } })) ??
    (await prisma.affiliate.findUnique({ where: { referralCode: raw.toUpperCase() } }));

  if (!affiliate || affiliate.status === "SUSPENDED") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const userAgent = headersList.get("user-agent")?.slice(0, 480) || null;
  const referrer = headersList.get("referer")?.slice(0, 480) || null;

  await prisma.click.create({
    data: {
      affiliateId: affiliate.id,
      subId: subid ? subid.slice(0, 100) : null,
      ip,
      userAgent,
      referrer,
      destination: "whatsapp",
    },
  });

  const config = await getSiteConfig();
  const phone = (config.contact_whatsapp || "584262931869").replace(/\D/g, "");
  const message = config.contact_whatsapp_message || "¡Hola Caskiuz! 👋 Me gustaría conversar sobre un proyecto.";
  const ref = affiliateRef(affiliate.slug, affiliate.referralCode);
  const text = `${message}\n\nCódigo de referido: ${ref}`;

  return NextResponse.redirect(
    `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  );
}
