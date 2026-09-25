import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { serialize } from "@/lib/affiliate-queries";
import { WithdrawalsClient } from "@/components/affiliates/panel/withdrawals-client";

export const dynamic = "force-dynamic";

export default async function WithdrawalsPage() {
  const affiliate = await requireAffiliate();

  await releaseMaturedCommissions(affiliate.id);

  const [methods, withdrawals, kycDoc, commissionAgg] = await Promise.all([
    prisma.payoutMethod.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    }),
    prisma.withdrawal.findMany({
      where: { affiliateId: affiliate.id },
      include: {
        payoutMethod: {
          select: { type: true, currency: true, network: true, address: true, binanceId: true, binanceEmail: true, label: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.affiliateDocument.findFirst({
      where: { affiliateId: affiliate.id, type: "ID", status: "APPROVED" },
    }),
    prisma.commission.groupBy({
      by: ["status"],
      where: { affiliateId: affiliate.id },
      _sum: { amount: true },
    }),
  ]);

  const byStatus = (status: string) =>
    commissionAgg.find((c) => c.status === status)?._sum.amount ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Retiros</h1>
        <p className="text-muted-foreground mt-1">
          Cobra tus comisiones en USDT, USDC, BTC o Binance Pay.
        </p>
      </div>
      <WithdrawalsClient
        country={affiliate.country}
        initialBalanceAvailable={byStatus("AVAILABLE")}
        initialBalancePending={byStatus("HOLD") + byStatus("WITHDRAWING")}
        initialKycApproved={Boolean(kycDoc)}
        initialMethods={serialize(methods)}
        initialWithdrawals={serialize(
          withdrawals.map((w) => ({ ...w, createdAt: w.createdAt.toISOString(), paidAt: w.paidAt?.toISOString() ?? null }))
        )}
      />
    </div>
  );
}
