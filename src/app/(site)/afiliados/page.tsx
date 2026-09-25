import type { Metadata } from "next";
import { AffiliateHero } from "@/components/affiliates/landing/hero";
import { HowItWorks } from "@/components/affiliates/landing/how-it-works";
import { Tiers } from "@/components/affiliates/landing/tiers";
import { Catalog } from "@/components/affiliates/landing/catalog";
import { ClientPayments } from "@/components/affiliates/landing/payments";
import { Benefits } from "@/components/affiliates/landing/benefits";
import { AffiliateFaq } from "@/components/affiliates/landing/faq";
import { FinalCta } from "@/components/affiliates/landing/cta";
import { JsonLd } from "@/components/seo/json-ld";
import { getSiteConfigByGroup } from "@/lib/site-config";
import { getPagoMovil } from "@/lib/payments";
import { mergeServices, type ServiceItem } from "@/lib/services-defaults";

const BASE_URL = "https://caskiuz.vercel.app";

export const metadata: Metadata = {
  title: "Programa de Afiliados Caskiuz | Gana hasta 40% de comisión",
  description:
    "Únete gratis a la red de afiliados de Caskiuz: gana entre 10% y 40% de comisión promocionando servicios de desarrollo web, apps, e-commerce y SEO. Pagos en USDT, USDC, Bitcoin y Binance Pay.",
  keywords: [
    "programa de afiliados",
    "ganar dinero online",
    "comisiones por venta",
    "afiliados desarrollo web",
    "marketing de afiliados",
    "red de afiliados",
    "cobrar en USDT",
    "Binance Pay",
    "vender servicios digitales",
    "Caskiuz affiliates",
  ],
  alternates: { canonical: `${BASE_URL}/afiliados` },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Caskiuz Affiliates",
    title: "Programa de Afiliados Caskiuz | Gana hasta 40% de comisión",
    description:
      "Comparte tu link único y gana entre 10% y 40% por cada venta de servicios digitales. Pagos en USDT, USDC, BTC y Binance Pay.",
    url: `${BASE_URL}/afiliados`,
    images: [{ url: "/api/og/afiliados", width: 1200, height: 630, alt: "Caskiuz Affiliates" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Programa de Afiliados Caskiuz | Gana hasta 40% de comisión",
    description:
      "Gana entre 10% y 40% de comisión promocionando servicios digitales. Pagos en USDT, USDC, BTC y Binance Pay.",
    images: ["/api/og/afiliados"],
  },
};

export const dynamic = "force-dynamic";

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "¿Cuánto cuesta unirse al programa de afiliados de Caskiuz?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Unirse es 100% gratis. Solo debes registrarte, aceptar los términos y compartir tu link único. No hay cuotas de entrada ni mínimos de venta.",
      },
    },
    {
      "@type": "Question",
      name: "¿Qué comisión paga el programa?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Entre 10% y 40% del monto efectivamente cobrado al cliente, según el nivel del afiliado: Plata 10%, Oro 20% (desde $2,000 USD referidos), Platino 30% (desde $5,000) y Diamante 40% (desde $15,000).",
      },
    },
    {
      "@type": "Question",
      name: "¿Cómo pagan las comisiones?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "En USDT o USDC en redes Tron, Ethereum, BNB Smart Chain, Solana, Polygon o Arbitrum; también en Bitcoin o vía Binance Pay. El retiro mínimo es de $30 USD.",
      },
    },
  ],
};

export default async function AffiliatesPage() {
  const groups = await getSiteConfigByGroup();
  const affiliateConfig = groups["affiliates"] ?? {};
  const servicesData = affiliateConfig["services_data"];
  let services: ServiceItem[] = [];
  try {
    services = mergeServices(servicesData ? JSON.parse(servicesData) : []);
  } catch {
    services = mergeServices([]);
  }

  const c = (key: string, fallback: string) => affiliateConfig[key] || fallback;
  const pagoMovil = getPagoMovil(groups["payments"] ?? {});

  return (
    <div className="aff-glow">
      <JsonLd data={FAQ_JSON_LD} />
      <AffiliateHero />
      <HowItWorks />
      <Tiers />
      <Catalog services={services} />
      <ClientPayments pagoMovil={pagoMovil} />
      <Benefits />
      <AffiliateFaq />
      <FinalCta />
      <p className="hidden" aria-hidden>
        {c("affiliates_seo_note", "Red de afiliados oficial de Caskiuz: gana comisiones promocionando desarrollo web, apps móviles, e-commerce, dashboards, integración IA y servicios SEO.")}
      </p>
    </div>
  );
}
