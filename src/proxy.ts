import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_SECRET = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
const encodedSecret = new TextEncoder().encode(AUTH_SECRET);

/** Secciones que solo puede abrir el admin GLOBAL (edición de la web). */
const GLOBAL_ONLY_PREFIXES = ["/admin/settings"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas bajo /admin, excepto /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    try {
      const { payload } = await jwtVerify(token, encodedSecret);
      if (payload.role !== "admin") throw new Error("rol inválido");

      // La página de Red de Afiliados sí la puede usar el rol AFFILIATES;
      // el resto del editor de la web queda solo para el GLOBAL.
      const affiliateSettings =
        pathname === "/admin/settings/affiliates" ||
        pathname.startsWith("/admin/settings/affiliates/");
      const needsGlobal =
        GLOBAL_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !affiliateSettings;

      if (needsGlobal && payload.adminRole !== "GLOBAL") {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    } catch {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Proteger el panel de afiliados (la verificación criptográfica del JWT
  // se hace en el layout del panel)
  if (pathname.startsWith("/afiliados/panel")) {
    const token = request.cookies.get("affiliate_token")?.value;
    if (!token) {
      const loginUrl = new URL("/afiliados/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/afiliados/panel/:path*"],
};
