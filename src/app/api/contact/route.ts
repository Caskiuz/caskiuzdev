import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { REFERRAL_COOKIE } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

/**
 * Captura leads de contacto. Si el visitante llegó por un link de afiliado
 * (cookie cask_ref), el lead queda atribuido a ese afiliado.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, service, message, refCode } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // 1) Cookie de referido (link único del afiliado)
    let affiliateId: number | null = null;
    let clickId: number | null = null;
    const refCookie = request.cookies.get(REFERRAL_COOKIE)?.value;
    if (refCookie) {
      const [rawAffiliateId, rawClickId] = refCookie.split(":");
      const parsedAffiliateId = Number(rawAffiliateId);
      const parsedClickId = Number(rawClickId);
      if (Number.isFinite(parsedAffiliateId) && parsedAffiliateId > 0) {
        affiliateId = parsedAffiliateId;
        clickId = Number.isFinite(parsedClickId) && parsedClickId > 0 ? parsedClickId : null;
      }
    }

    // 2) Código de referido escrito manualmente por el cliente
    if (!affiliateId && refCode) {
      const affiliate = await prisma.affiliate.findUnique({
        where: { referralCode: String(refCode).trim().toUpperCase() },
      });
      if (affiliate && affiliate.status === "ACTIVE") {
        affiliateId = affiliate.id;
      }
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        email,
        service: service || null,
        message,
        affiliateId,
        clickId,
      },
    });

    // Marcar el clic como convertido a lead
    if (clickId && affiliateId) {
      await prisma.click.updateMany({
        where: { id: clickId, affiliateId },
        data: { convertedAt: new Date() },
      }).catch(() => {
        // no fatal si el clic ya no existe
      });
    }

    console.log(
      `📩 Nuevo contacto: ${contact.email}${affiliateId ? ` (afiliado #${affiliateId})` : ""}`
    );

    return NextResponse.json({ success: true, id: contact.id }, { status: 201 });
  } catch (error) {
    console.error("Error al guardar contacto:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
