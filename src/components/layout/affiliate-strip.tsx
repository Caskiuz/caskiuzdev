import Link from "next/link";
import { Handshake } from "lucide-react";

/**
 * Tira discreta de afiliados: una línea sutil sobre el footer, presente en
 * todas las páginas públicas SIN invadir — no es popup, no interrumpe el
 * contenido ni compite con el CTA de clientes. Solo un enlace al programa
 * para quien tenga audiencia.
 */
export function AffiliateStrip() {
  return (
    <div className="border-t border-border bg-surface/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-xs sm:text-sm text-muted-foreground">
        <Handshake className="w-3.5 h-3.5 text-aff-cyan/70 shrink-0" />
        <span>
          ¿Tienes audiencia o conoces negocios? Gana hasta{" "}
          <span className="text-aff-cyan font-semibold">40% de comisión</span>{" "}
          recomendando mis servicios
        </span>
        <Link
          href="/afiliados"
          className="inline-flex items-center font-semibold text-aff-cyan hover:underline whitespace-nowrap"
        >
          Programa de afiliados →
        </Link>
      </div>
    </div>
  );
}
