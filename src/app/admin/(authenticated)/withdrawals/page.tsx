import { prisma } from "@/lib/prisma/client";
import { serialize } from "@/lib/affiliate-queries";
import { getSiteConfig } from "@/lib/site-config";
import { getUsdCopRate, getUsdVesRate } from "@/lib/payments";
import { ensureFreshRates, readStoredRate } from "@/lib/exchange-rates";
import { WithdrawalsManager } from "@/components/admin/withdrawals-manager";
import { Wallet } from "lucide-react";

export const dynamic = "force-dynamic";

/** "hoy" / "ayer" / fecha corta para la etiqueta de la tasa */
function formatRateDateLabel(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(today) - startOfDay(date)) / 86_400_000);
  if (diffDays <= 0) return "hoy";
  if (diffDays === 1) return "ayer";
  return date.toLocaleDateString("es-VE", { day: "2-digit", month: "short" });
}

export default async function AdminWithdrawalsPage() {
  // Refresca las tasas automáticamente si el dato guardado está viejo.
  await ensureFreshRates();

  const [config, withdrawals] = await Promise.all([
    getSiteConfig(),
    prisma.withdrawal.findMany({
      include: {
        affiliate: { select: { id: true, name: true, email: true } },
        payoutMethod: true,
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  ]);

  const usdVesRate = getUsdVesRate(config);
  const usdCopRate = getUsdCopRate(config);
  const vesMeta = readStoredRate(config, "ves");
  const copMeta = readStoredRate(config, "cop");
  const ratesMeta = {
    ves: { source: vesMeta.source, dateLabel: formatRateDateLabel(vesMeta.date) },
    cop: { source: copMeta.source, dateLabel: formatRateDateLabel(copMeta.date) },
  };
  const pending = withdrawals.filter((w) => w.status === "REQUESTED").length;

  return (
    <div className="p-4 space-y-6 sm:p-6 sm:space-y-8 lg:p-8">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> Retiros ({pending} pendientes)
        </h1>
        <p className="text-muted-foreground mt-1">
          Proceso de pago: paga manualmente desde Binance o tu wallet, pega la referencia del
          pago y marca como pagado. Los retiros por Pago Móvil se pagan en bolívares al
          afiliado venezolano; los de Nequi, Daviplata o Bancolombia en pesos colombianos; los
          de Zelle en dólares. Las tasas de cambio (Bs y COP) se actualizan automáticamente
          desde fuentes públicas. El afiliado recibe una notificación por email.
        </p>
      </div>

      <WithdrawalsManager
        usdVesRate={usdVesRate}
        usdCopRate={usdCopRate}
        ratesMeta={ratesMeta}
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
              pagoMovilPhone: w.payoutMethod.pagoMovilPhone,
              pagoMovilBank: w.payoutMethod.pagoMovilBank,
              pagoMovilHolder: w.payoutMethod.pagoMovilHolder,
              pagoMovilId: w.payoutMethod.pagoMovilId,
              accountData: w.payoutMethod.accountData,
            },
          }))
        )}
      />
    </div>
  );
}
