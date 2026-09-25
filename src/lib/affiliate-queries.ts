import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";

/**
 * Consultas agregadas del panel de afiliados.
 * Todas las funciones retornan datos serializables a client components.
 */

export function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export interface AffiliateStats {
  totalClicks: number;
  totalLeads: number;
  totalSales: number;
  totalRevenue: number;
  conversionRate: number; // leads / clicks
  epc: number; // comisiones aprobadas+disponibles / clics
  balanceAvailable: number;
  balancePending: number; // HOLD
  lifetimePaid: number; // comisiones PAID
  clicksLast30: { date: string; count: number }[];
}

export async function getAffiliateStats(affiliateId: number): Promise<AffiliateStats> {
  // Liberar comisiones maduras antes de calcular (hold de 30 días)
  await releaseMaturedCommissions(affiliateId);

  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [totalClicks, totalLeads, sales, commissionAgg, clicksLast30] = await Promise.all([
    prisma.click.count({ where: { affiliateId } }),
    prisma.contact.count({ where: { affiliateId } }),
    prisma.sale.findMany({
      where: { affiliateId },
      select: { amount: true, collectedAmount: true, commissionTotal: true, status: true },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { affiliateId },
      _sum: { amount: true },
    }),
    prisma.click.groupBy({
      by: ["createdAt"],
      where: { affiliateId, createdAt: { gte: since30 } },
      _count: { _all: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const byStatus = (status: string) =>
    commissionAgg.find((c) => c.status === status)?._sum.amount ?? 0;

  const totalSold = sales
    .filter((s) => s.status !== "REFUNDED")
    .reduce((acc, s) => acc + (s.collectedAmount || 0), 0);

  const approvedLike = byStatus("AVAILABLE") + byStatus("PAID");

  // Ventana completa de 30 días (rellenar días sin clics con 0)
  const clicksMap = new Map(
    clicksLast30.map((c) => [c.createdAt.toISOString().slice(0, 10), c._count._all])
  );
  const clicksWindow: { date: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().slice(0, 10);
    clicksWindow.push({ date: key, count: clicksMap.get(key) ?? 0 });
  }

  return {
    totalClicks,
    totalLeads,
    totalSales: sales.filter((s) => s.status !== "REFUNDED").length,
    totalRevenue: totalSold,
    conversionRate: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
    epc: totalClicks > 0 ? approvedLike / totalClicks : 0,
    balanceAvailable: byStatus("AVAILABLE"),
    balancePending: byStatus("HOLD"),
    lifetimePaid: byStatus("PAID"),
    clicksLast30: clicksWindow,
  };
}

export function getCommissionStatusLabel(status: string): string {
  switch (status) {
    case "HOLD":
      return "En retención";
    case "AVAILABLE":
      return "Disponible";
    case "PAID":
      return "Pagada";
    case "REVERSED":
      return "Reversada";
    case "WITHDRAWING":
      return "En retiro";
    default:
      return status;
  }
}

export function getSaleStatusLabel(status: string): string {
  switch (status) {
    case "LEAD":
      return "Lead";
    case "DEPOSIT_PAID":
      return "Anticipo pagado";
    case "FULLY_PAID":
      return "Pagado completo";
    case "REFUNDED":
      return "Reembolsado";
    default:
      return status;
  }
}

export function getWithdrawalStatusLabel(status: string): string {
  switch (status) {
    case "REQUESTED":
      return "Solicitado";
    case "APPROVED":
      return "Aprobado";
    case "PAID":
      return "Pagado";
    case "REJECTED":
      return "Rechazado";
    default:
      return status;
  }
}
