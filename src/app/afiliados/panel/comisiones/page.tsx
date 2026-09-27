import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import {
  getCommissionStatusLabel,
  getSaleStatusLabel,
  serialize,
} from "@/lib/affiliate-queries";
import { formatUsd, MIN_WITHDRAWAL } from "@/lib/affiliate";
import { CheckCircle2, Wallet, XCircle, Clock } from "lucide-react";
import Link from "next/link";
import { WithdrawalsClient } from "@/components/affiliates/panel/withdrawals-client";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, { icon: typeof Clock; className: string }> = {
  AVAILABLE: { icon: Wallet, className: "bg-aff-blue/10 text-aff-cyan" },
  PAID: { icon: CheckCircle2, className: "bg-green-500/10 text-green-500" },
  REVERSED: { icon: XCircle, className: "bg-accent/10 text-accent" },
  WITHDRAWING: { icon: Clock, className: "bg-aff-blue/10 text-aff-cyan" },
};

export default async function CommissionsPage() {
  const affiliate = await requireAffiliate();

  const [commissions, methods, withdrawals, kycDoc, commissionAgg] = await Promise.all([
    prisma.commission.findMany({
      where: { affiliateId: affiliate.id },
      include: { sale: { select: { serviceTitle: true, amount: true, status: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
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

  const totals = {
    available: commissions
      .filter((c) => c.status === "AVAILABLE")
      .reduce((a, c) => a + c.amount, 0),
    withdrawing: byStatus("WITHDRAWING"),
    paid: byStatus("PAID"),
  };

  const data = serialize(commissions);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Comisiones y retiros</h1>
          <p className="text-muted-foreground mt-1">
            Cuando el cliente paga, tu comisión queda disponible al instante.
          </p>
        </div>
        {totals.available >= MIN_WITHDRAWAL && (
          <a href="#retirar" className="btn-aff metal-shine px-6 py-3 text-sm">
            Solicitar retiro de {formatUsd(totals.available)}
          </a>
        )}
      </div>

      {/* Resumen */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Disponible para retirar", value: totals.available, hint: `Mínimo de retiro ${formatUsd(MIN_WITHDRAWAL)}` },
          { label: "En retiro", value: totals.withdrawing, hint: "Solicitudes en proceso de pago" },
          { label: "Pagado total", value: totals.paid, hint: "Comisiones ya cobradas" },
        ].map((card) => (
          <div key={card.label} className="metal-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{formatUsd(card.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Historial de comisiones */}
      <div className="metal-card rounded-2xl overflow-hidden">
        <div className="px-5 pt-5">
          <h2 className="font-bold">Historial de comisiones</h2>
        </div>
        {data.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-muted-foreground">
              Aún no tienes comisiones. ¡Comparte tu link y convierte tu primer cliente!
            </p>
            <Link
              href="/afiliados/panel/enlaces"
              className="btn-aff metal-shine px-6 py-3 text-sm mt-6 inline-flex"
            >
              Obtener mi link
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                  <th className="px-5 py-3">Servicio</th>
                  <th className="px-5 py-3">Venta</th>
                  <th className="px-5 py-3">Comisión</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {data.map((commission) => {
                  const style = STATUS_STYLES[commission.status] ?? STATUS_STYLES.AVAILABLE;
                  const Icon = style.icon;
                  return (
                    <tr key={commission.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                      <td className="px-5 py-3.5 font-medium">{commission.sale.serviceTitle}</td>
                      <td className="px-5 py-3.5 text-muted-foreground">
                        {formatUsd(commission.sale.amount)} · {getSaleStatusLabel(commission.sale.status)}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-aff-cyan">{formatUsd(commission.amount)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${style.className}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {getCommissionStatusLabel(commission.status)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground text-xs">
                        {new Date(commission.createdAt).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Solicitar retiro, métodos e historial */}
      <div id="retirar" className="scroll-mt-24">
        <WithdrawalsClient
          country={affiliate.country}
          initialBalanceAvailable={totals.available}
          initialKycApproved={Boolean(kycDoc)}
          initialMethods={serialize(methods)}
          initialWithdrawals={serialize(
            withdrawals.map((w) => ({ ...w, createdAt: w.createdAt.toISOString(), paidAt: w.paidAt?.toISOString() ?? null }))
          )}
        />
      </div>
    </div>
  );
}
