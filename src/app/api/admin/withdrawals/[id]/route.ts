import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { sendEmail, emailShell } from "@/lib/email";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

/**
 * Transiciones de retiro:
 * - APPROVED: el admin confirma que pagará (sigue reservando las comisiones)
 * - PAID: pago ejecutado; requiere txHash; libera las comisiones a PAID
 * - REJECTED: rechazado; devuelve las comisiones a AVAILABLE
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const withdrawalId = Number(id);
    const body = await request.json();
    const { status, txHash, notes } = body;

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
      include: { affiliate: true, payoutMethod: true },
    });
    if (!withdrawal) {
      return NextResponse.json({ error: "Retiro no encontrado" }, { status: 404 });
    }

    if (!["APPROVED", "PAID", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
    }

    if (status === "PAID" && !txHash) {
      return NextResponse.json(
        { error: "Para marcar como pagado debes registrar el hash/tranId de la transacción." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.withdrawal.update({
        where: { id: withdrawalId },
        data: {
          status,
          txHash: txHash ? String(txHash).slice(0, 255) : withdrawal.txHash,
          notes: notes ? String(notes).slice(0, 2000) : withdrawal.notes,
          reviewedAt: withdrawal.reviewedAt ?? new Date(),
          paidAt: status === "PAID" ? new Date() : withdrawal.paidAt,
        },
      });

      if (status === "PAID") {
        await tx.commission.updateMany({
          where: { withdrawalId, status: "WITHDRAWING" },
          data: { status: "PAID" },
        });
      } else if (status === "REJECTED") {
        await tx.commission.updateMany({
          where: { withdrawalId, status: "WITHDRAWING" },
          data: { status: "AVAILABLE", withdrawalId: null },
        });
      }
      return result;
    });

    // Notificar por email (si Resend está configurado)
    const methodLabel =
      withdrawal.payoutMethod.type === "BINANCE_PAY"
        ? `Binance Pay (${withdrawal.payoutMethod.binanceId || withdrawal.payoutMethod.binanceEmail})`
        : `${withdrawal.payoutMethod.currency} (${withdrawal.payoutMethod.network})`;
    await sendEmail({
      to: withdrawal.affiliate.email,
      subject:
        status === "PAID"
          ? "✅ Tu retiro fue pagado — Caskiuz Affiliates"
          : status === "REJECTED"
            ? "⚠️ Tu retiro fue rechazado — Caskiuz Affiliates"
            : "🕓 Tu retiro fue aprobado — Caskiuz Affiliates",
      html: emailShell(`
        <h2 style="margin:0 0 12px;">Actualización de tu retiro</h2>
        <p><strong>Monto:</strong> $${withdrawal.netAmount.toFixed(2)} USD</p>
        <p><strong>Método:</strong> ${methodLabel}</p>
        <p><strong>Estado:</strong> ${
          status === "PAID" ? "Pagado" : status === "REJECTED" ? "Rechazado" : "Aprobado (en proceso de pago)"
        }</p>
        ${txHash ? `<p><strong>Hash/TranId:</strong> ${String(txHash).slice(0, 255)}</p>` : ""}
        ${notes ? `<p><strong>Nota:</strong> ${String(notes).slice(0, 2000)}</p>` : ""}
        <p>Revisa tu panel: <a href="https://caskiuz.vercel.app/afiliados/panel/retiros" style="color:#38bdf8;">afiliados/panel/retiros</a></p>
      `),
    });

    console.log(`💳 Retiro #${withdrawalId} → ${status}`);
    return NextResponse.json({ success: true, withdrawal: updated });
  } catch (error) {
    console.error("Error actualizando retiro:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  await releaseMaturedCommissions();

  const { id } = await params;
  const withdrawal = await prisma.withdrawal.findUnique({
    where: { id: Number(id) },
    include: { affiliate: true, payoutMethod: true },
  });
  if (!withdrawal) {
    return NextResponse.json({ error: "Retiro no encontrado" }, { status: 404 });
  }
  return NextResponse.json(withdrawal);
}
