import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

const COOKIE_NAME = "admin_token";
const MAX_AGE = 60 * 60 * 8; // 8 horas

export async function createToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(encodedSecret);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, encodedSecret);
    return true;
  } catch {
    return false;
  }
}

export async function setAuthCookie(): Promise<void> {
  const token = await createToken();
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifyToken(token);
}