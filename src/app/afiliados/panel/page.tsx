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
      label: "En retiro (pendiente)",
      value: formatUsd(stats.balancePending),
      sub: "Solicitudes en proceso de pago",
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
      href: "/afiliados/panel/leads",
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
        {cards.map((card) => {
          const content = (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <card.icon className="w-4 h-4 text-aff-cyan" />
              </div>
              <p className="text-2xl font-bold mt-2">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </>
          );
          return "href" in card && card.href ? (
            <Link
              key={card.label}
              href={card.href}
              className="metal-card rounded-2xl p-5 hover:bg-surface-hover transition-colors"
            >
              {content}
            </Link>
          ) : (
            <div key={card.label} className="metal-card rounded-2xl p-5">
              {content}
            </div>
          );
        })}
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

      {/* Cómo se te acredita una venta */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-1">🔗 Cómo se te acredita una venta</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Tu código de referido: <strong className="text-aff-cyan">{affiliate.slug || affiliate.referralCode}</strong>
        </p>
        <ul className="space-y-3 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <span><strong className="text-foreground">Tu link + formulario:</strong> el cliente entra por tu link y llena el formulario → el lead queda a tu nombre automáticamente.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <span><strong className="text-foreground">Tu link + WhatsApp de la web:</strong> si te escribe por los botones de WhatsApp de la web, tu código viaja solo en el mensaje.</span>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <span><strong className="text-foreground">Tu link de WhatsApp directo:</strong> compártelo en bio o estados (está en «Mis enlaces») y el cliente te escribe con tu código ya escrito, aunque no pase por la web.</span>
          </li>
        </ul>
        <p className="text-xs text-aff-cyan mt-4">
          💡 Regla de oro: si tu cliente te escribe por otro canal (DM, teléfono), pídele que mencione tu código de referido.
        </p>
      </div>

      {/* Accesos rápidos */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { href: "/afiliados/panel/enlaces", title: "Obtener mi link", text: "Copia tu link único y empieza a compartir." },
          { href: "/afiliados/panel/catalogo", title: "Ver catálogo", text: "Servicios y comisiones por cada venta." },
          { href: "/afiliados/panel/comisiones", title: "Cobrar mis comisiones", text: "Tu saldo disponible, solicita el retiro y registra tu wallet o Binance Pay." },
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
