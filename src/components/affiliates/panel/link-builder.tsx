"use client";

import { useState } from "react";
import { Check, Copy, Globe, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHARE_PLATFORMS } from "@/lib/share-platforms";
import { PLATFORM_ICONS } from "./social-icons";

export function LinkBuilder({ referralCode }: { referralCode: string }) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const baseUrl = "https://caskiuz.vercel.app";
  const link = `${baseUrl}/r/${referralCode}`;
  const linkFor = (slug: string) => `${link}?subid=${slug}`;

  async function copy(value: string, key: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 2000);
    } catch {
      // Clipboard API no disponible: fallback silencioso
    }
  }

  return (
    <div className="space-y-6">
      <div className="metal-border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground mb-2">Tu link único de afiliado</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-mono text-aff-cyan truncate">
            {link}
          </code>
          <button
            onClick={() => copy(link, "main")}
            className="btn-aff metal-shine px-5 py-3 text-sm shrink-0"
          >
            {copiedKey === "main" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copiedKey === "main" ? "Copiado" : "Copiar"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
          <Globe className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Tu link siempre lleva a la página principal de Caskiuz: tu cliente ve todos los
          servicios, cómo trabajamos y el contacto.
        </p>
      </div>

      <div className="metal-card rounded-2xl p-6">
        <h2 className="font-bold mb-1">Comparte en cada red social</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Cada red tiene su propio link: así sabrás de dónde vienen tus clics. Pulsa una y
          el link queda copiado, listo para pegar.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {SHARE_PLATFORMS.map((platform) => {
            const Icon = PLATFORM_ICONS[platform.slug];
            const copied = copiedKey === platform.slug;
            return (
              <button
                key={platform.slug}
                type="button"
                onClick={() => copy(linkFor(platform.slug), platform.slug)}
                title={linkFor(platform.slug)}
                className={cn(
                  "flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm font-medium transition-colors",
                  copied
                    ? "border-aff-cyan/60 bg-aff-blue/10 text-aff-cyan"
                    : "border-border bg-surface-hover hover:border-aff-cyan/40 hover:text-aff-cyan"
                )}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span className="truncate">{copied ? "Copiado" : platform.label}</span>
                {copied ? (
                  <Check className="w-4 h-4 ml-auto shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 ml-auto shrink-0 opacity-50" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-aff-cyan" /> ¿Cómo funciona el tracking?
        </p>
        Cada persona que haga clic en tu link recibe una cookie de 30 días. Con ese solo
        link queda cubierto todo: si llena el formulario, se registra solo; y si te escribe
        por WhatsApp (los botones de WhatsApp de la web o el chat de IA), tu código viaja
        automáticamente en el mensaje. Como cada red tiene su propio link, en las listas de
        abajo ves cuántos clics te trae cada una. Si el proyecto se concreta, generas
        comisión sobre el monto cobrado según tu nivel.
      </div>
    </div>
  );
}
