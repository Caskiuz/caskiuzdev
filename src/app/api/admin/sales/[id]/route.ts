import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma/client";
import { isAuthenticated } from "@/lib/auth";
import { syncSaleCommission } from "@/lib/commissions";
import { notifyAffiliateSale } from "@/lib/notifications";

export const dynamic = "force-dynamic";

async function checkAuth() {
  const ok = await isAuthenticated();
  if (!ok) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return null;
}

const VALID_STATUSES = ["LEAD", "DEPOSIT_PAID", "FULLY_PAID", "REFUNDED"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const saleId = Number(id);
    const body = await request.json();
    const { status, amount, serviceTitle, affiliateId } = body;

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    const data: {
      status?: string;
      amount?: number;
      serviceTitle?: string;
      affiliateId?: number;
    } = {};

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json({ error: "Estado inválido." }, { status: 400 });
      }
      data.status = status;
    }
    if (amount !== undefined) {
      const parsed = Number(amount);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return NextResponse.json({ error: "Monto inválido." }, { status: 400 });
      }
      data.amount = parsed;
    }
    if (serviceTitle !== undefined) {
      data.serviceTitle = String(serviceTitle).slice(0, 160);
    }
    if (affiliateId !== undefined) {
      const parsedAffiliate = Number(affiliateId);
      const affiliate = await prisma.affiliate.findUnique({ where: { id: parsedAffiliate } });
      if (!affiliate) {
        return NextResponse.json({ error: "Afiliado no encontrado." }, { status: 404 });
      }
      // Cambiar de afiliado: reversar la comisión previa y crear con el nuevo
      const existingCommission = await prisma.commission.findFirst({ where: { saleId } });
      if (existingCommission && existingCommission.status !== "PAID" && existingCommission.status !== "WITHDRAWING") {
        await prisma.commission.update({
          where: { id: existingCommission.id },
          data: { status: "REVERSED", amount: 0, availableAt: null },
        });
      }
      data.affiliateId = parsedAffiliate;
    }

    const updated = await prisma.sale.update({ where: { id: saleId }, data });
    await syncSaleCommission(saleId);
    await notifyAffiliateSale(saleId, "updated");

    console.log(`✏️ Venta #${saleId} actualizada (${Object.keys(data).join(", ")})`);
    return NextResponse.json({ success: true, sale: updated });
  } catch (error) {
    console.error("Error actualizando venta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await checkAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const saleId = Number(id);

    const sale = await prisma.sale.findUnique({ where: { id: saleId } });
    if (!sale) {
      return NextResponse.json({ error: "Venta no encontrada" }, { status: 404 });
    }

    const commission = await prisma.commission.findFirst({ where: { saleId } });
    if (commission && commission.status !== "PAID" && commission.status !== "WITHDRAWING") {
      await prisma.commission.delete({ where: { id: commission.id } });
    }
    await prisma.sale.delete({ where: { id: saleId } });

    console.log(`🗑️ Venta #${saleId} eliminada`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error eliminando venta:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
