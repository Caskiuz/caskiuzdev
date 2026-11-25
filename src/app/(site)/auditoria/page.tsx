import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { AuditClient } from "./audit-client";

const BASE_URL = "https://caskiuz.vercel.app";

export const metadata: Metadata = {
  title: "Auditoría Web Gratis — Analiza tu página en 10 segundos | Caskiuz",
  description:
    "Analiza gratis la velocidad, el SEO, el móvil y la conversión de tu web. Informe instantáneo con los problemas que te están costando clientes y cómo arreglarlos.",
  keywords: [
    "auditoría web gratis",
    "analizar mi página web",
    "revisión SEO gratis",
    "test velocidad web",
    "auditoria pagina web venezuela",
    "diagnostico web negocio",
  ],
  alternates: { canonical: `${BASE_URL}/auditoria` },
  openGraph: {
    title: "Auditoría Web Gratis — Caskiuz",
    description:
      "Velocidad, SEO, móvil y conversión de tu web en un informe instantáneo. Gratis y sin registro.",
    url: `${BASE_URL}/auditoria`,
    siteName: "Caskiuz Portfolio",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Auditoría Web Gratis")}&subtitle=${encodeURIComponent("Velocidad · SEO · Móvil · Conversión")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

const FAQ = [
  {
    q: "¿La auditoría es realmente gratis?",
    a: "Sí. Analizamos tu página pública sin registro y sin costo. No guardamos la URL ni pedimos datos para mostrarte el informe.",
  },
  {
    q: "¿Qué revisa exactamente?",
    a: "HTTPS, tiempo de respuesta del servidor, peso del HTML, título y meta descripción, H1, canónica, datos estructurados, imágenes sin texto alternativo, adaptación móvil, botón de WhatsApp y analítica.",
  },
  {
    q: "¿Puedo auditar la web de un competidor?",
    a: "Sí, cualquier URL pública. Es una forma rápida de ver oportunidades antes de contactar a un negocio o de comparar tu presencia con la de la competencia.",
  },
  {
    q: "¿Qué hago con los resultados?",
    a: "Empieza por los problemas de severidad alta: suelen ser HTTPS, velocidad, falta de móvil o ausencia de WhatsApp. Si quieres, te preparo una propuesta con prioridades y precios claros.",
  },
];

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  const schema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Auditoría Web Gratis de Caskiuz",
    url: `${BASE_URL}/auditoria`,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    description:
      "Auditoría instantánea y gratuita de velocidad, SEO on-page, móvil y conversión de cualquier página web.",
    author: { "@type": "Person", name: "Ricardo Agelvis", alternateName: "Caskiuz" },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen pt-24 pb-24 aff-glow">
      <JsonLd data={schema} />
      <JsonLd data={faqSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.25em] text-aff-cyan font-semibold mb-3">
            Herramienta gratuita
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Auditoría web <span className="gradient-text">gratis</span> en 10 segundos
          </h1>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Escribe la URL de tu negocio y descubre qué le está costando clientes:
            velocidad, SEO, móvil, WhatsApp y analítica. Sin registro y sin instalar nada.
          </p>
        </div>

        <AuditClient initialUrl={url || ""} />

        {/* FAQ */}
        <div className="mt-14">
          <h2 className="text-xl font-bold mb-4 text-center">Preguntas frecuentes</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="glass-card p-4 group">
                <summary className="cursor-pointer text-sm font-semibold list-none flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-aff-cyan text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Prefieres que lo revise yo y te diga qué priorizar?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/#contact" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl">
              Hablar conmigo
            </Link>
            <Link href="/servicios/desarrollo-web" className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors">
              Ver servicios de web →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
