import Link from "next/link";
import { prisma } from "@/lib/prisma/client";
import { formatUsd } from "@/lib/affiliate";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  let pendingMessages = 0;
  let subscribers = 0;
  let publishedPosts = 0;
  let totalAffiliates = 0;
  let pendingWithdrawals = 0;
  let pendingDocs = 0;
  let commissionsPaid = 0;
  let commissionsPending = 0;
  let clicks7d = 0;
  let leads7d = 0;
  let dbError: string | null = null;

  try {
    const since7 = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const [messages, subs, posts, affiliates, withdrawals, docs, paidAgg, pendingAgg, clicksWeek, leadsWeek] =
      await Promise.all([
        prisma.contact.count({ where: { read: false } }),
        prisma.subscriber.count({ where: { active: true } }),
        prisma.blogPost.count({ where: { published: true } }),
        prisma.affiliate.count(),
        prisma.withdrawal.count({ where: { status: "REQUESTED" } }),
        prisma.affiliateDocument.count({ where: { status: "PENDING" } }),
        prisma.commission.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
        prisma.commission.aggregate({
          where: { status: { in: ["HOLD", "AVAILABLE", "WITHDRAWING"] } },
          _sum: { amount: true },
        }),
        prisma.click.count({ where: { createdAt: { gte: since7 } } }),
        prisma.contact.count({ where: { createdAt: { gte: since7 } } }),
      ]);

    pendingMessages = messages;
    subscribers = subs;
    publishedPosts = posts;
    totalAffiliates = affiliates;
    pendingWithdrawals = withdrawals;
    pendingDocs = docs;
    commissionsPaid = paidAgg._sum.amount ?? 0;
    commissionsPending = pendingAgg._sum.amount ?? 0;
    clicks7d = clicksWeek;
    leads7d = leadsWeek;
  } catch (error) {
    console.error("Error al conectar con la base de datos:", error);
    const msg =
      error instanceof Error ? error.message : JSON.stringify(error);
    dbError = `Error: ${msg}`;
  }

  return (
    <div className="min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Admin Panel
          </span>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Panel de <span className="gradient-text">Administración</span>
          </h1>
          <p className="mt-4 text-muted-foreground">
            Gestiona los mensajes de contacto, suscriptores, contenido del
            blog y la red de afiliados.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {pendingMessages}
            </div>
            <div className="text-sm font-medium">Mensajes Pendientes</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {subscribers}
            </div>
            <div className="text-sm font-medium">Suscriptores</div>
          </div>
          <div className="glass-card p-6 text-center">
            <div className="text-4xl font-bold gradient-text mb-2">
              {publishedPosts}
            </div>
            <div className="text-sm font-medium">Posts Publicados</div>
          </div>
        </div>

        {/* KPIs de la red de afiliados */}
        <h2 className="mt-14 text-lg font-bold mb-4 text-center">🤝 Red de Afiliados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            href="/admin/affiliates"
            className="glass-card p-6 hover:scale-[1.01] transition-transform"
          >
            <div className="text-4xl font-bold text-aff-cyan mb-2">{totalAffiliates}</div>
            <div className="text-sm font-medium">Afiliados registrados</div>
            {pendingDocs > 0 && (
              <p className="text-xs text-yellow-500 mt-2">📄 {pendingDocs} documento(s) KYC por revisar</p>
            )}
          </Link>
          <Link
            href="/admin/withdrawals"
            className="glass-card p-6 hover:scale-[1.01] transition-transform"
          >
            <div className="text-4xl font-bold text-aff-cyan mb-2">{pendingWithdrawals}</div>
            <div className="text-sm font-medium">Retiros por procesar</div>
          </Link>
          <Link
            href="/admin/sales"
            className="glass-card p-6 hover:scale-[1.01] transition-transform"
          >
            <div className="text-4xl font-bold text-aff-cyan mb-2">{formatUsd(commissionsPending)}</div>
            <div className="text-sm font-medium">Comisiones por pagar (disponible + en retiro)</div>
          </Link>
          <div className="glass-card p-6">
            <div className="text-4xl font-bold text-green-500 mb-2">{formatUsd(commissionsPaid)}</div>
            <div className="text-sm font-medium">Comisiones pagadas totales</div>
          </div>
          <Link
            href="/admin/affiliates"
            className="glass-card p-6 hover:scale-[1.01] transition-transform"
          >
            <div className="text-4xl font-bold text-aff-cyan mb-2">{clicks7d.toLocaleString("en-US")}</div>
            <div className="text-sm font-medium">Clics de afiliados (últimos 7 días)</div>
          </Link>
          <Link
            href="/admin/messages"
            className="glass-card p-6 hover:scale-[1.01] transition-transform"
          >
            <div className="text-4xl font-bold text-aff-cyan mb-2">{leads7d.toLocaleString("en-US")}</div>
            <div className="text-sm font-medium">Leads nuevos (últimos 7 días)</div>
          </Link>
        </div>

        {dbError ? (
          <div className="mt-12 glass-card p-8 text-center border-red-500/30">
            <h2 className="text-xl font-bold mb-4">
              ⚠️ Error de conexión
            </h2>
            <p className="text-muted-foreground mb-4 max-w-lg mx-auto">
              {dbError}
            </p>
            <div className="inline-block text-left bg-surface border border-border rounded-xl p-4 text-sm font-mono">
              npx prisma db push
            </div>
          </div>
        ) : (
          <div className="mt-12 glass-card p-8 text-center">
            <h2 className="text-xl font-bold mb-4">
              ✅ Base de datos conectada
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              La conexión a la base de datos MySQL en Aiven funciona
              correctamente. Los datos se están leyendo y escribiendo sin
              problemas.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}