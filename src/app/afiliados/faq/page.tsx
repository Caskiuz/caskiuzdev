import type { Metadata } from "next";
import Link from "next/link";
import { AFFILIATE_FAQS } from "@/lib/affiliate-content";
import { JsonLd } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Preguntas Frecuentes — Programa de Afiliados | Caskiuz",
  description:
    "Resolvemos tus dudas sobre el programa de afiliados de Caskiuz: comisiones de 10% a 40%, pagos en USDT, USDC, BTC y Binance Pay, retiros y más.",
  alternates: { canonical: "https://caskiuz.vercel.app/afiliados/faq" },
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: AFFILIATE_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.q,
    acceptedAnswer: { "@type": "Answer", text: faq.a },
  })),
};

export default function FaqPage() {
  return (
    <div className="aff-glow min-h-screen py-28">
      <JsonLd data={FAQ_JSON_LD} />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/afiliados" className="inline-block">
            <span className="metal-text text-2xl font-bold tracking-tight">CASKIUZ AFFILIATES</span>
          </Link>
          <h1 className="mt-4 text-4xl font-bold">Preguntas frecuentes</h1>
          <p className="mt-3 text-muted-foreground">
            Todo lo que necesitas saber sobre el programa de afiliados
          </p>
        </div>

        <div className="space-y-3">
          {AFFILIATE_FAQS.map((faq) => (
            <details key={faq.q} className="metal-card rounded-xl group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 font-semibold">
                {faq.q}
                <span className="text-aff-cyan shrink-0 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/afiliados/registro" className="btn-aff metal-shine px-7 py-3 inline-flex">
            Crear cuenta gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
