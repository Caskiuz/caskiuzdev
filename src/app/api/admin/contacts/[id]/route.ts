import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { notifyLeadAssigned } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/**
 * Actualiza un lead: asigna/quita afiliado y/o cambia el estado del pipeline.
 * Body: { affiliateId?: number|null, status?: "NEW"|"CONTACTED"|"PROPOSAL"|"WON"|"LOST" }
 * Al asignar, avisa al afiliado por el centro de notificaciones interno.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const contactId = Number(id);
    const body = await request.json().catch(() => ({}));
    const { affiliateId, status } = body;

    const VALID_STATUSES = ["NEW", "CONTACTED", "PROPOSAL", "WON", "LOST"];
    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    const contact = await prisma.contact.findUnique({ where: { id: contactId } });
    if (!contact) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // Solo cambio de estado del pipeline (sin tocar afiliado)
    if (affiliateId === undefined && status !== undefined) {
      const updated = await prisma.contact.update({
        where: { id: contactId },
        data: { status },
      });
      return NextResponse.json({ success: true, contact: updated });
    }

    let parsedAffiliateId: number | null = null;
    if (affiliateId !== null && affiliateId !== undefined && affiliateId !== "") {
      parsedAffiliateId = Number(affiliateId);
      if (!Number.isInteger(parsedAffiliateId) || parsedAffiliateId <= 0) {
        return NextResponse.json({ error: "Afiliado inválido." }, { status: 400 });
      }
      const affiliate = await prisma.affiliate.findUnique({ where: { id: parsedAffiliateId } });
      if (!affiliate) {
        return NextResponse.json({ error: "Afiliado no encontrado." }, { status: 404 });
      }
    }

    const updated = await prisma.contact.update({
      where: { id: contactId },
      data: {
        affiliateId: parsedAffiliateId,
        attributionSource: parsedAffiliateId ? "MANUAL" : null,
        ...(status !== undefined ? { status } : {}),
      },
    });

    // Si el lead tenía un clic asociado, marcarlo como convertido
    if (updated.clickId && updated.affiliateId) {
      await prisma.click.updateMany({
        where: { id: updated.clickId, affiliateId: updated.affiliateId },
        data: { convertedAt: new Date() },
      }).catch(() => {
        // no fatal si el clic ya no existe
      });
    }

    if (updated.affiliateId) {
      await notifyLeadAssigned(updated.id);
    }

    console.log(
      `🔗 Lead #${contactId} → afiliado #${updated.affiliateId ?? "sin afiliado"}`
    );
    return NextResponse.json({ success: true, contact: updated });
  } catch (error) {
    console.error("Error asignando lead:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
