"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { Lightbulb, ChevronDown, ArrowRight } from "lucide-react";

const emptySubscribe = () => () => {};

function lsKey(pageKey: string) {
  return `panel-guide-${pageKey}`;
}

interface SectionGuideProps {
  /** Clave única por sección para recordar si está plegada (ej: "enlaces") */
  pageKey: string;
  /** Subtítulo corto, ej: "Aquí está tu dinero" */
  title: string;
  /** Explicación de 1-2 frases antes de los pasos */
  intro: string;
  /** 2-4 pasos numerados */
  steps: string[];
  /** Enlace al apartado exacto de Ayuda y guías */
  helpHref?: string;
}

/**
 * Guía de inicio plegable para cada sección del panel: explica en 2-4 pasos
 * qué se hace ahí. El estado abierto/cerrado se recuerda en localStorage.
 */
export function SectionGuide({ pageKey, title, intro, steps, helpHref }: SectionGuideProps) {
  // Evita parpadeos de hidratación: antes del montaje siempre abierta (como el SSR)
  const mounted = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    // Leer la preferencia guardada después del montaje (asíncrono para el lint)
    Promise.resolve().then(() => {
      try {
        if (localStorage.getItem(lsKey(pageKey)) === "0") setOpen(false);
      } catch {
        /* localStorage no disponible */
      }
    });
  }, [pageKey]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(lsKey(pageKey), next ? "1" : "0");
    } catch {
      /* localStorage no disponible */
    }
  }

  return (
    <section className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5 text-aff-cyan" />
          </div>
          <div>
            <h2 className="font-bold">¿Qué haces aquí?</h2>
            <p className="text-xs text-muted-foreground">{title}</p>
          </div>
        </div>
        <button
          onClick={toggle}
          aria-label={open ? "Ocultar guía" : "Mostrar guía"}
          className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors shrink-0 text-muted-foreground hover:text-foreground"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${open ? "" : "-rotate-90"}`} />
        </button>
      </div>

      {(mounted ? open : true) && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{intro}</p>
          <ol className="space-y-2">
            {steps.map((step, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed"
              >
                <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          {helpHref && (
            <Link
              href={helpHref}
              className="inline-flex items-center gap-1 text-sm text-aff-cyan hover:underline"
            >
              Ver guía completa <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
