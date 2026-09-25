import { AFFILIATE_FAQS } from "@/lib/affiliate-content";
import Link from "next/link";
import { BookOpen, LifeBuoy } from "lucide-react";

const GUIDES = [
  {
    title: "Primeros pasos",
    steps: [
      "Ve a 'Mis enlaces' y copia tu link único.",
      "Elige un destino (recomendado: sección de servicios).",
      "Agrega un sub-ID para identificar tu campaña (ej: 'instagram').",
      "Comparte el link en tus redes y comunidades.",
    ],
  },
  {
    title: "Cómo cobrar",
    steps: [
      "Sube tu documento de identidad en 'Documentos' y espera la aprobación.",
      "Registra tu método de pago en 'Retiros' (Binance Pay o wallet USDT/USDC/BTC).",
      "Cuando tengas $30 USD o más en saldo disponible, solicita el retiro.",
      "Recibirás tu pago en un máximo de 7 días hábiles.",
    ],
  },
  {
    title: "Cómo subir de nivel",
    steps: [
      "Nivel Plata: 10% desde tu primera venta.",
      "Nivel Oro (20%): acumula $2,000 USD en ventas referidas cobradas.",
      "Nivel Platino (30%): acumula $5,000 USD.",
      "Nivel Diamante (40%): acumula $15,000 USD.",
    ],
  },
];

export default function HelpPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-aff-cyan" /> Ayuda y guías
        </h1>
        <p className="text-muted-foreground mt-1">
          Guías rápidas y preguntas frecuentes del programa.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {GUIDES.map((guide) => (
          <div key={guide.title} className="metal-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">{guide.title}</h2>
            <ol className="space-y-3">
              {guide.steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      <div className="metal-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {AFFILIATE_FAQS.map((faq) => (
            <details key={faq.q} className="rounded-xl bg-surface-hover border border-border group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 text-sm font-semibold">
                {faq.q}
                <span className="text-aff-cyan shrink-0 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LifeBuoy className="w-6 h-6 text-aff-cyan" />
          <p className="text-sm text-muted-foreground">
            ¿No encuentras la respuesta? Nuestro equipo de soporte está para ayudarte.
          </p>
        </div>
        <Link href="/afiliados/panel/soporte" className="btn-aff metal-shine px-5 py-2.5 text-sm">
          Abrir ticket de soporte
        </Link>
      </div>
    </div>
  );
}
