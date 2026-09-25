import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma/client";
import { releaseMaturedCommissions } from "@/lib/commissions";
import { getTierInfo, formatUsd } from "@/lib/affiliate";
import { serialize } from "@/lib/affiliate-queries";
import { AffiliateActions } from "@/components/admin/affiliate-actions";
import { DocumentReview } from "@/components/admin/document-review";
import { ArrowLeft, Mail } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminAffiliateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await releaseMaturedCommissions();
  const { id } = await params;
  const affiliateId = Number(id);

  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      payoutMethods: true,
      sales: { orderBy: { createdAt: "desc" }, take: 50 },
      commissions: { orderBy: { createdAt: "desc" }, take: 50 },
      withdrawals: { orderBy: { createdAt: "desc" }, take: 20 },
      contacts: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { clicks: true } },
    },
  });

  if (!affiliate) notFound();

  const tier = getTierInfo(affiliate.tier);
  const docs = affiliate.documents.map((d) => ({
    id: d.id,
    type: d.type,
    fileName: d.fileName,
    status: d.status,
    notes: d.notes,
    createdAt: d.createdAt.toISOString(),
  }));
  const sales = serialize(affiliate.sales);
  const withdrawals = serialize(affiliate.withdrawals);
  const commissions = serialize(affiliate.commissions);
  const contacts = serialize(affiliate.contacts);

  return (
    <div className="p-8 space-y-8">
      <Link
        href="/admin/affiliates"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a afiliados
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center border border-border shrink-0">
            {affiliate.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={affiliate.avatar} alt={affiliate.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white font-bold text-xl">
                {affiliate.name
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase())
                  .join("")}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{affiliate.name}</h1>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" /> {affiliate.email} · {affiliate.country}
              {affiliate.phone ? ` · ${affiliate.phone}` : ""}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Código: <code className="font-mono text-aff-cyan">{affiliate.referralCode}</code> · Link:{" "}
              <code className="font-mono">caskiuz.vercel.app/r/{affiliate.referralCode}</code>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {affiliate.termsAcceptedAt
                ? `Contrato y términos aceptados el ${new Date(affiliate.termsAcceptedAt).toLocaleDateString("es-ES")}`
                : "Sin registro de aceptación de términos"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-aff-cyan">
            {tier.emoji} {tier.name} · {Math.round(tier.rate * 100)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {formatUsd(affiliate.lifetimeRevenue)} referidos cobrados · {affiliate._count.clicks} clics
          </p>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div className="grid sm:grid-cols-4 gap-4">
        {[
          { label: "Clics", value: affiliate._count.clicks.toLocaleString("en-US") },
          { label: "Leads", value: affiliate.contacts.length.toLocaleString("en-US") },
          { label: "Ventas", value: sales.length.toLocaleString("en-US") },
          {
            label: "Saldo pendiente",
            value: formatUsd(
              commissions
                .filter((c) => ["HOLD", "AVAILABLE", "WITHDRAWING"].includes(c.status))
                .reduce((a, c) => a + c.amount, 0)
            ),
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="text-xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        {/* Acciones */}
        <div className="rounded-2xl border border-border bg-surface p-6 space-y-6">
          <h2 className="font-bold">Gestión de la cuenta</h2>
          <AffiliateActions
            affiliateId={affiliate.id}
            currentStatus={affiliate.status}
            currentTier={affiliate.tier}
          />

          <div>
            <h3 className="font-bold text-sm mb-3">Métodos de pago</h3>
            {affiliate.payoutMethods.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin métodos registrados.</p>
            ) : (
              <ul className="space-y-2">
                {affiliate.payoutMethods.map((m) => (
                  <li key={m.id} className="text-sm p-3 rounded-lg bg-surface-hover border border-border">
                    {m.type === "BINANCE_PAY"
                      ? `Binance Pay — ${m.binanceId || m.binanceEmail}`
                      : `${m.currency} (${m.network}) — ${m.address}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Documentos */}
        <div className="rounded-2xl border border-border bg-surface p-6">
          <h2 className="font-bold mb-4">Documentos (KYC)</h2>
          <DocumentReview documents={docs} />
        </div>
      </div>

      {/* Ventas */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold mb-4">Ventas ({sales.length})</h2>
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Sin ventas aún. Créalas desde la sección{" "}
            <Link href="/admin/sales" className="text-primary hover:underline">Ventas</Link>.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                  <th className="px-3 py-2">Servicio</th>
                  <th className="px-3 py-2">Monto</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Comisión</th>
                  <th className="px-3 py-2">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2.5 font-medium">{sale.serviceTitle}</td>
                    <td className="px-3 py-2.5">{formatUsd(sale.amount)}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{sale.status}</td>
                    <td className="px-3 py-2.5 text-aff-cyan font-medium">{formatUsd(sale.commissionTotal)}</td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">
                      {new Date(sale.createdAt).toLocaleDateString("es-ES")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Retiros */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold mb-4">Retiros ({withdrawals.length})</h2>
        {withdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin retiros.</p>
        ) : (
          <ul className="space-y-2">
            {withdrawals.map((w) => (
              <li key={w.id} className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0">
                <span className="font-medium">{formatUsd(w.netAmount)}</span>
                <span className="text-muted-foreground">{w.status}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(w.createdAt).toLocaleDateString("es-ES")}
                  {w.txHash ? ` · ${w.txHash.slice(0, 20)}…` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Leads atribuidos */}
      <div className="rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-bold mb-4">Leads atribuidos ({contacts.length})</h2>
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin leads atribuidos aún.</p>
        ) : (
          <ul className="space-y-2">
            {contacts.map((contact) => (
              <li key={contact.id} className="text-sm py-2 border-b border-border last:border-0">
                <span className="font-medium">{contact.name}</span>{" "}
                <span className="text-muted-foreground">({contact.email})</span> — {contact.service || "Sin servicio"}
                <span className="block text-xs text-muted-foreground mt-0.5 line-clamp-1">{contact.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
