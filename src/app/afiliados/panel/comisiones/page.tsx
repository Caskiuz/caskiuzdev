import { requireAffiliate } from "@/lib/affiliate-auth";
import { prisma } from "@/lib/prisma/client";
import {
  getCommissionStatusLabel,
  getSaleStatusLabel,
  serialize,
} from "@/lib/affiliate-queries";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { formatUsd } from "@/lib/affiliate";
import { Clock, CheckCircle2, Wallet, XCircle } from "lucide-react";
import Link from "next/link";

const STATUS_STYLES: Record<string, { icon: typeof Clock; className: string }> = {
  HOLD: { icon: Clock, className: "bg-yellow-500/10 text-yellow-500" },
  AVAILABLE: { icon: Wallet, className: "bg-aff-blue/10 text-aff-cyan" },
  PAID: { icon: CheckCircle2, className: "bg-green-500/10 text-green-500" },
  REVERSED: { icon: XCircle, className: "bg-accent/10 text-accent" },
  WITHDRAWING: { icon: Clock, className: "bg-aff-blue/10 text-aff-cyan" },
};

export default async function CommissionsPage() {
  const affiliate = await requireAffiliate();

  await releaseMaturedCommissions(affiliate.id);

  const commissions = await prisma.commission.findMany({
    where: { affiliateId: affiliate.id },
    include: { sale: { select: { serviceTitle: true, amount: true, status: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const totals = {
    hold: commissions.filter((c) => c.status === "HOLD").reduce((a, c) => a + c.amount, 0),
    available: commissions.filter((c) => c.status === "AVAILABLE").reduce((a, c) => a + c.amount, 0),
    paid: commissions.filter((c) => c.status === "PAID").reduce((a, c) => a + c.amount, 0),
  };

  const data = serialize(commissions);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mis comisiones</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo con el estado de cada comisión.
          </p>
        </div>
        {totals.available >= 30 && (
          <Link href="/afiliados/panel/retiros" className="btn-aff metal-shine px-6 py-3 text-sm">
            Solicitar retiro de {formatUsd(totals.available)}
          </Link>
        )}
      </div>

      {/* Resumen */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "En retención", value: totals.hold, hint: "Se liberan tras 30 días del cobro total" },
          { label: "Disponible para retirar", value: totals.available, hint: "Mínimo de retiro $30 USD" },
          { label: "Pagado total", value: totals.paid, hint: "Comisiones ya cobradas" },
        ].map((card) => (
          <div key={card.label} className="metal-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold mt-1">{formatUsd(card.value)}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.hint}</p>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="metal-card rounded-2xl overflow-hidden">
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
                  const style = STATUS_STYLES[commission.status] ?? STATUS_STYLES.HOLD;
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
    </div>
  );
}
