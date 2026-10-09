import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import {
  REFERRAL_COOKIE,
  REFERRAL_COOKIE_DAYS,
  REFERRAL_CODE_COOKIE,
  VISITOR_COOKIE,
  VISITOR_COOKIE_DAYS,
  affiliateRef,
} from "@/lib/affiliate";

/**
 * Helpers de tracking de referidos (solo servidor).
 *
 * - setAttributionCookies: fija cask_ref (httpOnly, 30 días, affiliateId:clickId)
 *   y cask_ref_code (legible por JS, código del afiliado).
 * - getOrCreateVisitorId: cookie cask_visit (2 años) para deduplicar clics
 *   repetidos del mismo visitante y enlazar el embudo clic → lead.
 * - resolveAffiliateByRef: resuelve un afiliado por slug O código legado.
 * - clickDedupWindowMs: ventana en la que un re-clic no crea una fila nueva.
 */

export const CLICK_DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 horas

const cookieBase = {
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAttributionCookies(
  response: NextResponse,
  params: { affiliateId: number; clickId: number; ref: string }
) {
  response.cookies.set(REFERRAL_COOKIE, `${params.affiliateId}:${params.clickId}`, {
    httpOnly: true,
    ...cookieBase,
    maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
  });
  // Cookie legible por JS: los CTAs de WhatsApp incluyen el código en el mensaje.
  response.cookies.set(REFERRAL_CODE_COOKIE, params.ref, {
    ...cookieBase,
    maxAge: 60 * 60 * 24 * REFERRAL_COOKIE_DAYS,
  });
}

/** Devuelve el visitorId actual o crea uno y lo fija en la respuesta. */
export function getOrCreateVisitorId(request: NextRequest, response: NextResponse): string {
  const existing = request.cookies.get(VISITOR_COOKIE)?.value;
  if (existing && /^[a-f0-9-]{10,64}$/i.test(existing)) return existing;

  const visitorId = crypto.randomUUID();
  response.cookies.set(VISITOR_COOKIE, visitorId, {
    httpOnly: true,
    ...cookieBase,
    maxAge: 60 * 60 * 24 * VISITOR_COOKIE_DAYS,
  });
  return visitorId;
}

/** Resuelve un afiliado por slug (minúsculas) o código legado (mayúsculas). */
export async function resolveAffiliateByRef(raw: string) {
  const value = raw.trim();
  if (!value) return null;
  return (
    (await prisma.affiliate.findFirst({ where: { slug: value.toLowerCase() } })) ??
    (await prisma.affiliate.findUnique({ where: { referralCode: value.toUpperCase() } }))
  );
}

/** Código público del afiliado (slug si tiene, si no el código). */
export function publicRef(affiliate: { slug: string | null; referralCode: string }): string {
  return affiliateRef(affiliate.slug, affiliate.referralCode);
}
