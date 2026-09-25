import { requireAffiliate } from "@/lib/affiliate-auth";
import { getSiteConfigByGroup } from "@/lib/site-config";
import { mergeServices, type ServiceItem } from "@/lib/services-defaults";
import { getTierInfo, formatUsd } from "@/lib/affiliate";
import { getClientPaymentMethods } from "@/lib/payments";
import { TrendingUp, Link2, Smartphone, Landmark, Wallet, Coins, CreditCard, Globe } from "lucide-react";
import Link from "next/link";

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  "zelle": Landmark,
  "paypal": Wallet,
  "binance": Coins,
  "western-union": Globe,
  "crypto": CreditCard,
};

function extractPrice(price: string): number | null {
  const match = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export default async function CatalogPage() {
  const affiliate = await requireAffiliate();
  const tier = getTierInfo(affiliate.tier);

  const groups = await getSiteConfigByGroup();
  const servicesData = groups["affiliates"]?.["services_data"];
  const paymentMethods = getClientPaymentMethods(groups["payments"] ?? {});
  const paymentDetails = paymentMethods.filter((m) => m.detail);
  let services: ServiceItem[] = [];
  try {
    services = mergeServices(servicesData ? JSON.parse(servicesData) : []);
  } catch {
    services = mergeServices([]);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Catálogo de ofertas</h1>
        <p className="text-muted-foreground mt-1">
          Tu comisión actual:{" "}
          <strong className="text-aff-cyan">
            {tier.emoji} {Math.round(tier.rate * 100)}%
          </strong>{" "}
          sobre el monto cobrado. Sube de nivel con más ventas referidas.
        </p>
      </div>

      {/* Métodos de pago que aceptamos de tus clientes */}
      <div className="metal-card rounded-2xl p-5">
        <p className="text-sm font-bold mb-3">💳 ¿Cómo pagan tus clientes?</p>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((method) => {
            const Icon = METHOD_ICONS[method.id] ?? CreditCard;
            const isPagoMovil = method.id === "pago-movil";
            return (
              <span
                key={method.id}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  isPagoMovil
                    ? "border-aff-cyan/40 bg-aff-blue/10 text-aff-cyan"
                    : "border-border text-muted-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {method.label}
              </span>
            );
          })}
        </div>
        {paymentDetails.length > 0 && (
          <div className="mt-3 space-y-1.5">
            {paymentDetails.map((method) => (
              <p key={method.id} className="text-xs text-aff-cyan break-all">
                💳 {method.label}: {method.detail}
              </p>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          El esquema es 50% de anticipo y 50% al finalizar. Comparte estos datos con tus
          referidos para que paguen al instante. Tu comisión se te paga aparte, en USDT,
          USDC, BTC o Binance Pay.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {services.map((service) => {
          const price = extractPrice(service.price);
          return (
            <div key={service.id} className="metal-card rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="font-bold leading-snug">{service.title}</h3>
                {service.popular && (
                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-aff-blue to-aff-cyan">
                    POPULAR
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {service.description}
              </p>
              <div className="mt-auto space-y-3">
                <p className="text-sm font-semibold">{service.price}</p>
                {price !== null && (
                  <div className="rounded-xl bg-aff-blue/5 border border-aff-blue/15 p-3">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                      <TrendingUp className="w-3 h-3 text-aff-cyan" /> Tu comisión estimada
                    </p>
                    <p className="text-lg font-bold text-aff-cyan">
                      {formatUsd(price * tier.rate)}
                    </p>
                  </div>
                )}
                <Link
                  href="/afiliados/panel/enlaces"
                  className="inline-flex items-center gap-1.5 text-xs text-aff-cyan hover:underline"
                >
                  <Link2 className="w-3.5 h-3.5" /> Crear link para este servicio
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
