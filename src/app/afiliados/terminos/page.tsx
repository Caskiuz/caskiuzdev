import type { Metadata } from "next";
import Link from "next/link";
import { AFFILIATE_TERMS } from "@/lib/affiliate-content";

export const metadata: Metadata = {
  title: "Términos y Condiciones del Programa de Afiliados | Caskiuz",
  description:
    "Términos y condiciones del programa de afiliados de Caskiuz: comisiones, niveles, pagos en cripto, retenciones, prácticas prohibidas y más.",
  alternates: { canonical: "https://caskiuz.vercel.app/afiliados/terminos" },
};

export default function TermsPage() {
  return (
    <div className="aff-glow min-h-screen py-28">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Link href="/afiliados" className="inline-block">
            <span className="metal-text text-2xl font-bold tracking-tight">CASKIUZ AFFILIATES</span>
          </Link>
          <h1 className="mt-4 text-4xl font-bold">Términos y Condiciones</h1>
          <p className="mt-3 text-muted-foreground">
            Programa de afiliados de Caskiuz · Última actualización: {new Date().getFullYear()}
          </p>
        </div>

        <div className="metal-card rounded-2xl p-8 sm:p-10 space-y-8">
          {AFFILIATE_TERMS.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-bold mb-3 text-aff-cyan">{section.title}</h2>
              {section.paragraphs.map((paragraph, i) => (
                <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-3">
                  {paragraph}
                </p>
              ))}
            </section>
          ))}

          <div className="border-t border-border pt-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              ¿Tienes dudas sobre los términos? Escríbenos desde tu panel en la sección de soporte.
            </p>
            <Link href="/afiliados/registro" className="btn-aff metal-shine px-7 py-3 inline-flex">
              Entendido, quiero unirme
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
