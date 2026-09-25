import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger rutas bajo /admin, excepto /admin/login
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const token = request.cookies.get("admin_token")?.value;
    if (!token) {
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
