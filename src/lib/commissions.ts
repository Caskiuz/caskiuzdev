import { prisma } from "@/lib/prisma/client";
import { getTierByRevenue } from "@/lib/affiliate";

/**
 * Motor de comisiones de la red de afiliados.
 *
 * Reglas de negocio:
 * - La comisión se devenga SOLO sobre dinero cobrado (50% anticipo → mitad;
 *   pago total → 100%). Nunca sobre montos prometidos.
 * - Se calcula con la tasa del nivel actual del afiliado y queda congelada.
 * - La comisión queda DISPONIBLE al instante: en cuanto el cliente paga
 *   (anticipo o total), el afiliado ya puede retirarla.
 * - Un reembolso anula la comisión (a menos que ya esté pagada/en retiro).
 */

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Sincroniza la comisión de una venta según su estado de cobro y el nivel
 * actual del afiliado. Idempotente: puede llamarse en cada actualización.
 */
export async function syncSaleCommission(saleId: number): Promise<void> {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: { affiliate: true },
  });
  if (!sale) return;

  const rate = getTierByRevenue(sale.affiliate.lifetimeRevenue).rate;

  let collected = 0;
  if (sale.status === "DEPOSIT_PAID") collected = sale.amount * 0.5;
  if (sale.status === "FULLY_PAID") collected = sale.amount;
  if (sale.status === "REFUNDED") collected = 0;
  collected = round2(collected);

  const commissionAmount = round2(collected * rate);
  const existing = await prisma.commission.findFirst({ where: { saleId } });

  if (sale.status === "REFUNDED") {
    if (existing && existing.status !== "PAID" && existing.status !== "WITHDRAWING") {
      await prisma.commission.update({
        where: { id: existing.id },
        data: { status: "REVERSED", amount: 0, availableAt: null },
      });
    }
    await prisma.sale.update({
      where: { id: sale.id },
      data: { commissionRate: rate, commissionTotal: 0, collectedAmount: 0 },
    });
  } else if (existing) {
    // No tocar comisiones ya pagadas o reservadas en un retiro
    if (existing.status === "PAID" || existing.status === "WITHDRAWING") {
      await prisma.sale.update({
        where: { id: sale.id },
        data: { commissionRate: rate, collectedAmount: collected },
      });
      return;
    }
    // Disponible de inmediato: sin retención.
    await prisma.commission.update({
      where: { id: existing.id },
      data: {
        amount: commissionAmount,
        status: commissionAmount > 0 ? "AVAILABLE" : "REVERSED",
        availableAt: null,
      },
    });
    await prisma.sale.update({
      where: { id: sale.id },
      data: { commissionRate: rate, commissionTotal: commissionAmount, collectedAmount: collected },
    });
  } else if (commissionAmount > 0) {
    await prisma.commission.create({
      data: {
        saleId: sale.id,
        affiliateId: sale.affiliateId,
        amount: commissionAmount,
        status: "AVAILABLE",
        availableAt: null,
      },
    });
    await prisma.sale.update({
      where: { id: sale.id },
      data: { commissionRate: rate, commissionTotal: commissionAmount, collectedAmount: collected },
    });
  } else {
    await prisma.sale.update({
      where: { id: sale.id },
      data: { commissionRate: rate, collectedAmount: collected },
    });
  }

  // Recalcular volumen de por vida y nivel del afiliado
  const totalCollected = await prisma.sale.aggregate({
    where: { affiliateId: sale.affiliateId, status: { in: ["DEPOSIT_PAID", "FULLY_PAID"] } },
    _sum: { collectedAmount: true },
  });
  const lifetime = totalCollected._sum.collectedAmount ?? 0;
  await prisma.affiliate.update({
    where: { id: sale.affiliateId },
    data: { lifetimeRevenue: lifetime, tier: getTierByRevenue(lifetime).key },
  });
}
