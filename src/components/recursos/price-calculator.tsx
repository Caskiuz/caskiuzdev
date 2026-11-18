"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Calculator, CheckCircle2, MessageCircle } from "lucide-react";

/**
 * Calculadora "¿Cuánto cuesta mi web?" — imán de leads.
 * Estimaciones alineadas con los precios reales del catálogo; el resultado
 * invita al wizard (propuesta con IA) o a WhatsApp con el presupuesto listo.
 */

interface SiteType {
  id: string;
  label: string;
  desc: string;
  base: number;
  delivery: string;
}

const SITE_TYPES: SiteType[] = [
  { id: "landing", label: "Landing de ventas", desc: "1 página que vende un producto o servicio", base: 149, delivery: "3-5 días" },
  { id: "corporativa", label: "Web corporativa", desc: "4-8 páginas: inicio, servicios, sobre mí, contacto", base: 299, delivery: "1-2 semanas" },
  { id: "tienda", label: "Tienda online", desc: "Catálogo, carrito y pagos conectados", base: 699, delivery: "2-4 semanas" },
  { id: "app", label: "App / SaaS", desc: "Aplicación web con usuarios y datos", base: 599, delivery: "2-3 semanas" },
];

const EXTRAS = [
  { id: "seo", label: "SEO avanzado + Google Business", price: 99 },
  { id: "chatbot", label: "Chatbot de WhatsApp con IA", price: 199 },
  { id: "redes", label: "1 mes de redes sociales automatizadas", price: 200 },
  { id: "logo", label: "Identidad visual básica (logo + paleta)", price: 79 },
];

export function PriceCalculator() {
  const [type, setType] = useState<SiteType>(SITE_TYPES[0]);
  const [extras, setExtras] = useState<string[]>([]);

  const total = useMemo(() => {
    const extraSum = EXTRAS.filter((e) => extras.includes(e.id)).reduce((a, e) => a + e.price, 0);
    return type.base + extraSum;
  }, [type, extras]);

  const waMessage = encodeURIComponent(
    `Hola Caskiuz! 👋 Hice la calculadora de tu web: me interesa un(a) ${type.label}` +
    (extras.length ? ` + ${EXTRAS.filter((e) => extras.includes(e.id)).map((e) => e.label).join(", ")}` : "") +
    `. Estimé ~$${total} USD. ¿Podemos confirmar el precio exacto?`
  );

  return (
    <div className="glass-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
        <Calculator className="w-5 h-5 text-aff-cyan" />
        Calculadora: ¿cuánto cuesta tu web?
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Precios reales del catálogo, sin letra pequeña. En 30 segundos tienes tu estimado.
      </p>

      {/* Tipo de web */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        1 · ¿Qué necesitas?
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        {SITE_TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t)}
            className={`text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
              type.id === t.id
                ? "border-aff-cyan bg-aff-cyan/10 shadow-lg shadow-aff-cyan/10"
                : "border-border bg-surface hover:border-aff-cyan/40"
            }`}
          >
            <p className={`text-sm font-semibold ${type.id === t.id ? "text-aff-cyan" : ""}`}>{t.label}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
            <p className="text-[11px] font-bold mt-1">desde ${t.base}</p>
          </button>
        ))}
      </div>

      {/* Extras */}
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        2 · Extras (opcional)
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
        {EXTRAS.map((e) => {
          const active = extras.includes(e.id);
          return (
            <button
              key={e.id}
              type="button"
              onClick={() =>
                setExtras((prev) => (active ? prev.filter((x) => x !== e.id) : [...prev, e.id]))
              }
              className={`flex items-center gap-2.5 text-left px-4 py-3 rounded-xl border transition-all cursor-pointer ${
                active ? "border-aff-cyan bg-aff-cyan/10" : "border-border bg-surface hover:border-aff-cyan/40"
              }`}
            >
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${active ? "text-aff-cyan" : "text-muted-foreground/40"}`}
              />
              <span className="text-sm flex-1">{e.label}</span>
              <span className="text-xs font-bold text-aff-cyan">+${e.price}</span>
            </button>
          );
        })}
      </div>

      {/* Resultado */}
      <div className="rounded-2xl border border-aff-cyan/30 bg-aff-cyan/5 p-5 text-center">
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
          Tu estimado
        </p>
        <p className="text-4xl font-bold metal-text my-1">${total}</p>
        <p className="text-xs text-muted-foreground">
          pago 50% inicio / 50% entrega · tiempo estimado: {type.delivery}
          {extras.includes("chatbot") ? " (+5-10 días del chatbot)" : ""}
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1">
          El precio final se confirma en tu propuesta gratuita (la IA la prepara en minutos).
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-4">
          <Link
            href="/#contact"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl"
          >
            Recibir propuesta exacta (gratis) →
          </Link>
          <a
            href={`https://wa.me/584262931869?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-xl transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp con mi estimado
          </a>
        </div>
      </div>
    </div>
  );
}
