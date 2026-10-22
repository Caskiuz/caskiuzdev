import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma/client";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

const COOKIE_NAME = "admin_token";
const MAX_AGE = 60 * 60 * 8; // 8 horas

export type AdminRole = "GLOBAL" | "AFFILIATES";

export interface CurrentAdmin {
  id: number;
  username: string;
  name: string;
  role: AdminRole;
}

/** Firma el JWT de una sesión de admin (id + rol). */
export async function createAdminToken(admin: { id: number; role: AdminRole }): Promise<string> {
  return new SignJWT({ role: "admin", adminRole: admin.role })
    .setSubject(String(admin.id))
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(encodedSecret);
}

/** Verifica la firma del token de admin (sin consultar la BD). */
export async function verifyToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    return payload.role === "admin";
  } catch {
    return false;
  }
}

export async function setAuthCookie(admin: { id: number; role: AdminRole }): Promise<void> {
  const token = await createAdminToken(admin);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

/**
 * Admin de la sesión actual: verifica el JWT, carga la cuenta y comprueba que
 * siga activa. Devuelve null si no hay sesión válida.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, encodedSecret);
    if (payload.role !== "admin" || !payload.sub) return null;

    const id = Number(payload.sub);
    if (!Number.isFinite(id) || id <= 0) return null;

    const admin = await prisma.adminUser.findUnique({
      where: { id },
      select: { id: true, username: true, name: true, role: true, active: true },
    });
    if (!admin || !admin.active) return null;

    return {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role as AdminRole,
    };
  } catch {
    return null;
  }
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getCurrentAdmin()) !== null;
}

/** Guard del layout del panel: exige una sesión de admin válida. */
export async function requireAdmin(): Promise<CurrentAdmin> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login?redirect=/admin");
  return admin;
}

/**
 * Restringe una página o API a ciertos roles. Devuelve null si no hay sesión
 * o si el rol no está permitido (el llamador responde 401/403).
 */
export async function requireAdminRole(
  roles: AdminRole | AdminRole[]
): Promise<CurrentAdmin | null> {
  const admin = await getCurrentAdmin();
  if (!admin) return null;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(admin.role) ? admin : null;
}
