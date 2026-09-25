import Link from "next/link";
import { MousePointerClick, Users, ShoppingBag, TrendingUp, Wallet, Clock, ArrowRight } from "lucide-react";
import { requireAffiliate } from "@/lib/affiliate-auth";
import { getAffiliateStats } from "@/lib/affiliate-queries";
import { getTierInfo, nextTier, formatUsd, MIN_WITHDRAWAL } from "@/lib/affiliate";
import { ClicksChart } from "@/components/affiliates/panel/clicks-chart";

export default async function AffiliateDashboardPage() {
  const affiliate = await requireAffiliate();
  const stats = await getAffiliateStats(affiliate.id);
  const tier = getTierInfo(affiliate.tier);
  const upcoming = nextTier(affiliate.lifetimeRevenue);

  const progressPct = upcoming
    ? Math.min(100, (affiliate.lifetimeRevenue / upcoming.minRevenue) * 100)
    : 100;

  const cards = [
    {
      label: "Saldo disponible",
      value: formatUsd(stats.balanceAvailable),
      sub: stats.balanceAvailable >= MIN_WITHDRAWAL ? "¡Puedes retirar!" : `Retiro mínimo ${formatUsd(MIN_WITHDRAWAL)}`,
      icon: Wallet,
    },
    {
      label: "En retención (30 días)",
      value: formatUsd(stats.balancePending),
      sub: "Ventana de reembolsos",
      icon: Clock,
    },
    {
      label: "Clics totales",
      value: stats.totalClicks.toLocaleString("en-US"),
      sub: `${formatUsd(stats.epc)} EPC`,
      icon: MousePointerClick,
    },
    {
      label: "Leads referidos",
      value: stats.totalLeads.toLocaleString("en-US"),
      sub: `${stats.conversionRate.toFixed(1)}% conversión`,
      icon: Users,
    },
    {
      label: "Ventas atribuidas",
      value: stats.totalSales.toLocaleString("en-US"),
      sub: `${formatUsd(stats.totalRevenue)} referidos`,
      icon: ShoppingBag,
    },
    {
      label: "Pagado de por vida",
      value: formatUsd(stats.lifetimePaid),
      sub: "Comisiones pagadas",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">¡Hola, {affiliate.name.split(" ")[0]}! 👋</h1>
        <p className="text-muted-foreground mt-1">Este es el resumen de tu actividad como afiliado.</p>
      </div>

      {/* Nivel actual y progreso */}
      <div className="metal-border rounded-2xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Tu nivel actual</p>
            <p className="text-2xl font-bold text-aff-cyan mt-1">
              {tier.emoji} Nivel {tier.name} · {Math.round(tier.rate * 100)}% de comisión
            </p>
          </div>
          {upcoming ? (
            <div className="text-sm text-muted-foreground text-right">
              <p>
                Próximo nivel <strong className="text-foreground">{upcoming.name}</strong> ({Math.round(upcoming.rate * 100)}%)
              </p>
              <p>
                Te faltan{" "}
                <strong className="text-aff-cyan">{formatUsd(upcoming.minRevenue - affiliate.lifetimeRevenue)}</strong>{" "}
                en ventas cobradas
              </p>
            </div>
          ) : (
            <p className="text-sm text-aff-cyan font-semibold">👑 ¡Nivel máximo alcanzado!</p>
          )}
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-surface-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-aff-blue-deep via-aff-blue to-aff-cyan transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Ventas referidas cobradas de por vida: {formatUsd(affiliate.lifetimeRevenue)}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="metal-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{card.label}</p>
              <card.icon className="w-4 h-4 text-aff-cyan" />
            </div>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
          </div>
        ))}
      </div>

      {/* Clics últimos 30 días */}
      <div className="metal-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold">Clics en los últimos 30 días</h2>
          <Link
            href="/afiliados/panel/enlaces"
            className="inline-flex items-center gap-1 text-sm text-aff-cyan hover:underline"
          >
            Mis enlaces <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <ClicksChart data={stats.clicksLast30} />
      </div>

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/afiliados/panel/enlaces", title: "Obtener mi link", text: "Copia tu link único y empieza a compartir." },
          { href: "/afiliados/panel/catalogo", title: "Ver catálogo", text: "Servicios y comisiones por cada venta." },
          { href: "/afiliados/panel/retiros", title: "Configurar pagos", text: "Registra tu wallet o Binance Pay para cobrar." },
        ].map((quick) => (
          <Link
            key={quick.href}
            href={quick.href}
            className="glass-card rounded-2xl p-5 hover:bg-surface-hover transition-colors group"
          >
            <p className="font-bold group-hover:text-aff-cyan transition-colors">{quick.title}</p>
            <p className="text-sm text-muted-foreground mt-1">{quick.text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
