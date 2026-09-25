import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";

const AUTH_SECRET =
  process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

export const AFFILIATE_COOKIE = "affiliate_token";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 días

export interface AffiliateJwtPayload {
  sub: string; // affiliateId
  role: "affiliate";
}

export async function createAffiliateToken(affiliateId: number): Promise<string> {
  return new SignJWT({ role: "affiliate" })
    .setSubject(String(affiliateId))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(encodedSecret);
}

export async function verifyAffiliateToken(token: string): Promise<number | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.role !== "affiliate" || !payload.sub) return null;
    const id = Number(payload.sub);
    return Number.isFinite(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function setAffiliateCookie(affiliateId: number): Promise<void> {
  const token = await createAffiliateToken(affiliateId);
  const cookieStore = await cookies();
  cookieStore.set(AFFILIATE_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearAffiliateCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AFFILIATE_COOKIE);
}

/**
 * Lee el id del afiliado desde la cookie JWT (verificada criptográficamente).
 * Retorna null si no hay sesión válida.
 */
export async function getAffiliateId(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AFFILIATE_COOKIE)?.value;
  if (!token) return null;
  return verifyAffiliateToken(token);
}

/**
 * Obtiene el afiliado autenticado o null.
 */
export async function getCurrentAffiliate() {
  const id = await getAffiliateId();
  if (!id) return null;
  try {
    return await prisma.affiliate.findUnique({ where: { id } });
  } catch {
    return null;
  }
}

/**
 * Guard del layout del panel: redirige al login si no hay sesión válida
 * o si la cuenta está suspendida.
 */
export async function requireAffiliate() {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) redirect("/afiliados/login?redirect=/afiliados/panel");
  if (affiliate.status === "SUSPENDED") redirect("/afiliados/login?suspendida=1");
  return affiliate;
}

/**
 * Tokens de propósito único (verificación de email y reset de contraseña).
 * JWT firmado de 1 hora, sin necesidad de tablas extra.
 */
export async function createPurposeToken(
  email: string,
  purpose: "verify" | "reset"
): Promise<string> {
  return new SignJWT({ purpose, email })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(encodedSecret);
}

export async function verifyPurposeToken(
  token: string,
  purpose: "verify" | "reset"
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.purpose !== purpose || typeof payload.email !== "string") return null;
    return payload.email;
  } catch {
    return null;
  }
}
