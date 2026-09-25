import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

const VALID_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED"];
const VALID_TIERS = ["SILVER", "GOLD", "PLATINUM", "DIAMOND"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const affiliateId = Number(id);
    const body = await request.json();
    const { status, tier } = body;

    const affiliate = await prisma.affiliate.findUnique({ where: { id: affiliateId } });
    if (!affiliate) {
      return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });
    }

    const data: {
      status?: "PENDING" | "ACTIVE" | "SUSPENDED";
      tier?: "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    } = {};
    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
      }
      data.status = status as "PENDING" | "ACTIVE" | "SUSPENDED";
    }
    if (tier !== undefined) {
      if (!VALID_TIERS.includes(tier)) {
        return NextResponse.json({ error: "Nivel inválido." }, { status: 400 });
      }
      data.tier = tier as "SILVER" | "GOLD" | "PLATINUM" | "DIAMOND";
    }

    const updated = await prisma.affiliate.update({ where: { id: affiliateId }, data });

    console.log(`👤 Afiliado #${affiliateId} actualizado (${Object.keys(data).join(", ")})`);
    return NextResponse.json({ success: true, affiliate: updated });
  } catch (error) {
    console.error("Error actualizando afiliado:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
