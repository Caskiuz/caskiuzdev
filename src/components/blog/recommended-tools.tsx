import Link from "next/link";
import { ExternalLink, Handshake } from "lucide-react";
import { recommendedTools, AFFILIATE_DISCLOSURE } from "@/lib/recommendations";

/**
 * Recomendados de afiliados externos (hosting, dominios, herramientas).
 * Monetización pasiva del blog: con disclosure legal visible (obligatorio)
 * y siempre separado visualmente del contenido editorial.
 */
export function RecommendedTools({ compact = false }: { compact?: boolean }) {
  const tools = compact ? recommendedTools.slice(0, 3) : recommendedTools;

  return (
    <div className="glass-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
        <Handshake className="w-5 h-5 text-aff-cyan" />
        Herramientas que uso y recomiendo
      </h2>
      <p className="text-xs text-muted-foreground mb-5">
        Recursos para tu negocio — revisados personalmente.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {tools.map((tool) => (
          <a
            key={tool.name}
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group flex items-start gap-3 p-4 rounded-xl bg-surface border border-border hover:border-aff-cyan/40 transition-colors"
          >
            <span className="text-2xl shrink-0">{tool.emoji}</span>
            <div className="min-w-0">
              <p className="text-sm font-bold flex items-center gap-1.5">
                {tool.name}
                <ExternalLink className="w-3 h-3 text-muted-foreground group-hover:text-aff-cyan transition-colors" />
              </p>
              {!compact && (
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{tool.why}</p>
              )}
              <p className="text-[11px] text-aff-cyan mt-1.5 font-medium">{tool.price}</p>
            </div>
          </a>
        ))}
      </div>

      {/* Disclosure legal — obligatorio junto a enlaces de afiliados */}
      <p className="text-[10px] text-muted-foreground/70 leading-relaxed mt-4 border-t border-border pt-3">
        {AFFILIATE_DISCLOSURE}
      </p>

      {compact && (
        <p className="text-xs text-muted-foreground mt-3">
          ¿Quieres ganar comisiones recomendando mis servicios en cambio?{" "}
          <Link href="/afiliados" className="text-aff-cyan hover:underline font-medium">
            Programa de afiliados →
          </Link>
        </p>
      )}
    </div>
  );
}
