import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";

export const dynamic = "force-dynamic";

/**
 * Oculta (completed=true) o reabre (completed=false) la "Ruta de inicio"
 * del dashboard. Persiste en la DB para que valga en todos los dispositivos.
 */
export async function POST(request: NextRequest) {
  const affiliate = await getCurrentAffiliate();
  if (!affiliate) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const completed = body.completed === true;

  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: { onboardingCompletedAt: completed ? new Date() : null },
  });

  return NextResponse.json({ success: true, completed });
}
