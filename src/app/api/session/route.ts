import { NextResponse } from "next/server";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Estado de sesión para el top bar del sitio público: verificación JWT
 * completa (no solo existencia de cookie) de afiliado y admin.
 */
export async function GET() {
  const [affiliate, admin] = await Promise.all([getCurrentAffiliate(), isAuthenticated()]);

  return NextResponse.json(
    {
      affiliate: affiliate ? { name: affiliate.name } : null,
      admin,
    },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}
