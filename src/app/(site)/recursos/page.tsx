import type { Metadata } from "next";
import Link from "next/link";
import { PriceCalculator } from "@/components/recursos/price-calculator";
import { GatedChecklist } from "@/components/recursos/gated-checklist";
import { RecommendedTools } from "@/components/blog/recommended-tools";

const BASE_URL = "https://caskiuz.vercel.app";

export const metadata: Metadata = {
  title: "Recursos gratis para tu negocio | Caskiuz",
  description:
    "Herramientas gratuitas para hacer crecer tu negocio: calculadora de precios de páginas web, checklist de SEO local para Google Maps y herramientas recomendadas.",
  keywords: [
    "cuanto cuesta una pagina web",
    "calculadora precio web",
    "checklist seo local",
    "seo google maps gratis",
    "recursos para emprendedores",
  ],
  alternates: { canonical: `${BASE_URL}/recursos` },
  openGraph: {
    title: "Recursos gratis para tu negocio | Caskiuz",
    description:
      "Calculadora de precios de webs, checklist de SEO local y herramientas recomendadas — todo gratis.",
    url: `${BASE_URL}/recursos`,
    siteName: "Caskiuz Portfolio",
    images: [
      {
        url: "/api/og?title=Recursos%20gratis%20para%20tu%20negocio&subtitle=Calculadora%20de%20precios%20%C2%B7%20Checklist%20SEO%20local",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RecursosPage() {
  return (
    <div className="min-h-screen pt-28 pb-24 aff-glow">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
            Recursos gratis
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            Herramientas para hacer{" "}
            <span className="metal-text">crecer tu negocio</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Sin registro obligatorio, sin letra pequeña: calcula, revisa y actúa.
            Y si quieres que lo haga alguien más, ahí está mi propuesta gratuita.
          </p>
        </div>

        <div className="space-y-8">
          <PriceCalculator />

          {/* Auditoría web gratis (lead magnet) */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aff-cyan/10 via-transparent to-aff-blue/10 border border-aff-cyan/20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-aff-cyan mb-1.5">
                  Nuevo · gratis y sin registro
                </p>
                <h2 className="text-xl font-bold">Audita tu web en 10 segundos</h2>
                <p className="text-sm text-muted-foreground mt-1.5 max-w-xl">
                  Velocidad, SEO, móvil, botón de WhatsApp y analítica: descubre
                  qué le está costando clientes a tu página y cómo arreglarlo.
                </p>
              </div>
              <Link
                href="/auditoria"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl shrink-0"
              >
                Auditar mi web →
              </Link>
            </div>
          </div>

          <GatedChecklist />
          <RecommendedTools />

          {/* CTA a servicios */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-aff-blue/10 via-aff-blue/5 to-aff-cyan/10 border border-aff-blue/20 p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">
              ¿Prefieres que lo haga yo por ti?
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-5">
              Webs desde $149 · Chatbots de WhatsApp con IA · Redes sociales
              automatizadas. Propuesta preliminar con IA en minutos.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold btn-aff rounded-xl"
            >
              Cotizar en 3 pasos →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
