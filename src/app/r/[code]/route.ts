import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma/client";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_DAYS,
  REFERRAL_CODE_COOKIE,
  affiliateRef,
} from "@/lib/affiliate";

export const dynamic = "force-dynamic";

/**
 * Link de referido: registra el clic, fija la cookie de atribución (30 días)
 * y redirige al destino. Acepta el slug bonito (/r/ricardo-agelvis) o el
 * código legado (/r/XARUX5YH). Ejemplo: /r/ricardo-agelvis?subid=instagram
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const subid = request.nextUrl.searchParams.get("subid");
  const to = request.nextUrl.searchParams.get("to");

  const raw = decodeURIComponent(code).trim();
  const affiliate =
    (await prisma.affiliate.findFirst({ where: { slug: raw.toLowerCase() } })) ??
    (await prisma.affiliate.findUnique({ where: { referralCode: raw.toUpperCase() } }));

  if (!affiliate || affiliate.status === "SUSPENDED") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Registrar el clic
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;
  const userAgent = headersList.get("user-agent")?.slice(0, 480) || null;
  const referrer = headersList.get("referer")?.slice(0, 480) || null;

  const click = await prisma.click.create({
    data: {
      affiliateId: affiliate.id,
      subId: subid ? subid.slice(0, 100) : null,
      ip,
      userAgent,
      referrer,
      destination: to || "/#services",
    },
  });

  // Validar destino para evitar open redirects
  const target = String(to || "").startsWith("/") && !String(to).startsWith("//")
    ? String(to)
    : "/#services";

  const response = NextResponse.redirect(new URL(target, request.url));
  response.cookies.set(REFERRAL_COOKIE, `${affiliate.id}:${click.id}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
  });
  // Cookie legible por JS: permite que los CTAs de WhatsApp incluyan
  // automáticamente el código de referido en el mensaje del cliente.
  response.cookies.set(
    REFERRAL_CODE_COOKIE,
    affiliateRef(affiliate.slug, affiliate.referralCode),
    {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
    }
  );

  return response;
}
