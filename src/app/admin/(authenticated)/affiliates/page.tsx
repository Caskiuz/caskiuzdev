import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { getTierInfo, formatUsd } from "@/lib/affiliate";
import { Users, ArrowRight, FileWarning } from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-yellow-500/10 text-yellow-500" },
  ACTIVE: { label: "Activo", className: "bg-green-500/10 text-green-500" },
  SUSPENDED: { label: "Suspendido", className: "bg-accent/10 text-accent" },
};

/** Distintivo de documento de identidad pendiente de revisión */
function PendingDocBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-500/15 text-yellow-500 border border-yellow-500/30 ${className}`}
      title="Tiene un documento de identidad pendiente de revisión"
    >
      <FileWarning className="w-3 h-3" />
      Doc. pendiente
    </span>
  );
}

export default async function AdminAffiliatesPage() {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { clicks: true, sales: true } },
      commissions: { where: { status: { in: ["AVAILABLE", "HOLD", "WITHDRAWING"] } }, select: { amount: true, status: true } },
      documents: { where: { status: "PENDING" }, select: { id: true, type: true } },
    },
    take: 300,
  });

  const withPendingDocs = affiliates.filter((affiliate) => affiliate.documents.length > 0);
  const pendingWithdrawals = await prisma.withdrawal.count({ where: { status: "REQUESTED" } });

  return (
    <div className="p-4 space-y-6 sm:p-6 sm:space-y-8 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> Afiliados ({affiliates.length})
          </h1>
          <p className="text-muted-foreground mt-1">Gestiona la red de afiliados de Caskiuz.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/admin/sales" className="px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-hover transition-colors">
            Ventas
          </Link>
          <Link
            href="/admin/withdrawals"
            className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
          >
            Retiros pendientes ({pendingWithdrawals})
          </Link>
        </div>
      </div>

      {withPendingDocs.length > 0 && (
        <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
          <p className="font-semibold flex items-center gap-2">
            <FileWarning className="w-4 h-4 shrink-0" />
            {withPendingDocs.length === 1
              ? "1 afiliado tiene un documento de identidad pendiente de revisión:"
              : `${withPendingDocs.length} afiliados tienen documentos de identidad pendientes de revisión:`}
          </p>
          <ul className="mt-2 space-y-1">
            {withPendingDocs.map((affiliate) => (
              <li key={affiliate.id} className="flex flex-wrap items-center gap-x-2">
                <Link
                  href={`/admin/affiliates/${affiliate.id}`}
                  className="font-semibold underline underline-offset-2 hover:no-underline"
                >
                  {affiliate.name}
                </Link>
                <span className="opacity-70 text-xs break-all">{affiliate.email}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Móvil: una tarjeta por afiliado (la tabla no cabe en pantallas pequeñas) */}
      <div className="sm:hidden rounded-2xl border border-border bg-surface overflow-hidden divide-y divide-border">
        {affiliates.map((affiliate) => {
          const statusInfo = STATUS_LABELS[affiliate.status] ?? STATUS_LABELS.PENDING;
          const tier = getTierInfo(affiliate.tier);
          const pendingBalance = affiliate.commissions.reduce((acc, c) => acc + c.amount, 0);
          const hasPendingDoc = affiliate.documents.length > 0;
          return (
            <Link
              key={affiliate.id}
              href={`/admin/affiliates/${affiliate.id}`}
              className="block p-4 active:bg-surface-hover/70 hover:bg-surface-hover/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{affiliate.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{affiliate.email}</p>
                </div>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                  {statusInfo.label}
                </span>
              </div>

              {hasPendingDoc && <PendingDocBadge className="mt-2" />}

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span>{affiliate.country}</span>
                <span className="text-aff-cyan font-semibold">
                  {tier.emoji} {tier.name} ({Math.round(tier.rate * 100)}%)
                </span>
                <span>
                  {affiliate._count.sales} ventas · {formatUsd(affiliate.lifetimeRevenue)}
                </span>
                <span>{affiliate._count.clicks} clics</span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  Saldo pendiente: <strong className="text-foreground">{formatUsd(pendingBalance)}</strong>
                </span>
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  Ver detalle <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
        {affiliates.length === 0 && (
          <p className="px-5 py-10 text-center text-muted-foreground">
            Aún no hay afiliados registrados.
          </p>
        )}
      </div>

      {/* Escritorio: tabla */}
      <div className="hidden sm:block rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase tracking-wider">
                <th className="px-5 py-3">Afiliado</th>
                <th className="px-5 py-3">País</th>
                <th className="px-5 py-3">Nivel</th>
                <th className="px-5 py-3">Ventas referidas</th>
                <th className="px-5 py-3">Clics</th>
                <th className="px-5 py-3">Saldo pendiente</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {affiliates.map((affiliate) => {
                const statusInfo = STATUS_LABELS[affiliate.status] ?? STATUS_LABELS.PENDING;
                const tier = getTierInfo(affiliate.tier);
                const pendingBalance = affiliate.commissions.reduce((acc, c) => acc + c.amount, 0);
                return (
                  <tr key={affiliate.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{affiliate.name}</p>
                      <p className="text-xs text-muted-foreground">{affiliate.email}</p>
                      {affiliate.documents.length > 0 && <PendingDocBadge className="mt-1.5" />}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{affiliate.country}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-semibold text-aff-cyan">
                        {tier.emoji} {tier.name} ({Math.round(tier.rate * 100)}%)
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {affiliate._count.sales} · {formatUsd(affiliate.lifetimeRevenue)}
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{affiliate._count.clicks}</td>
                    <td className="px-5 py-3.5 font-medium">{formatUsd(pendingBalance)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/affiliates/${affiliate.id}`}
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        Ver detalle <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {affiliates.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-muted-foreground">
                    Aún no hay afiliados registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
