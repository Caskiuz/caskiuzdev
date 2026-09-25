import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { serialize } from "@/lib/affiliate-queries";
import { WithdrawalsManager } from "@/components/admin/withdrawals-manager";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminWithdrawalsPage() {
  await releaseMaturedCommissions();

  const withdrawals = await prisma.withdrawal.findMany({
    include: {
      affiliate: { select: { id: true, name: true, email: true } },
      payoutMethod: true,
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const pending = withdrawals.filter((w) => w.status === "REQUESTED").length;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> Retiros ({pending} pendientes)
        </h1>
        <p className="text-muted-foreground mt-1">
          Proceso de pago: paga manualmente desde Binance o tu wallet, pega el hash/TranId y
          marca como pagado. El afiliado recibe una notificación por email.
        </p>
      </div>

      <WithdrawalsManager
        withdrawals={serialize(
          withdrawals.map((w) => ({
            id: w.id,
            amount: w.amount,
            netAmount: w.netAmount,
            status: w.status,
            txHash: w.txHash,
            notes: w.notes,
            createdAt: w.createdAt.toISOString(),
            affiliate: w.affiliate,
            payoutMethod: {
              type: w.payoutMethod.type,
              currency: w.payoutMethod.currency,
              network: w.payoutMethod.network,
              address: w.payoutMethod.address,
              binanceId: w.payoutMethod.binanceId,
              binanceEmail: w.payoutMethod.binanceEmail,
            },
          }))
        )}
      />
    </div>
  );
}
