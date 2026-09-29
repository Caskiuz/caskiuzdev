import { NextRequest, NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { refreshStoredRates } from "@/lib/exchange-rates";

export const dynamic = "force-dynamic";

/**
 * Actualiza las tasas de cambio (USD → Bs paralelo y USD → COP TRM) y las
 * guarda en la configuración del sitio.
 *
 * Se invoca de dos formas:
 * - Cron de Vercel: Authorization: Bearer <CRON_SECRET>
 * - Botón "Actualizar ahora" del admin (cookie de sesión).
 */
async function handle(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const fromCron = Boolean(secret) && request.headers.get("authorization") === `Bearer ${secret}`;
  const fromAdmin = await isAuthenticated();
  if (!fromCron && !fromAdmin) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const result = await refreshStoredRates();
    console.log(
      `💱 Tasas: Bs ${result.ves.rate ?? "sin dato"} (${result.ves.source ?? result.ves.error}) · ` +
        `COP ${result.cop.rate ?? "sin dato"} (${result.cop.source ?? result.cop.error})`
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error actualizando tasas:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
