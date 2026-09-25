"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Link2 } from "lucide-react";

const DESTINATIONS = [
  { value: "/", label: "Página de inicio" },
  { value: "/#services", label: "Sección de servicios" },
  { value: "/#contact", label: "Formulario de contacto" },
  { value: "/blog", label: "Blog" },
];

export function LinkBuilder({ referralCode }: { referralCode: string }) {
  const [destination, setDestination] = useState("/#services");
  const [subid, setSubid] = useState("");
  const [copied, setCopied] = useState(false);

  const baseUrl = "https://caskiuz.vercel.app";
  const link = useMemo(() => {
    const params = new URLSearchParams();
    if (subid.trim()) params.set("subid", subid.trim().slice(0, 100));
    if (destination !== "/#services") params.set("to", destination);
    const qs = params.toString();
    return `${baseUrl}/r/${referralCode}${qs ? `?${qs}` : ""}`;
  }, [referralCode, destination, subid]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API no disponible: fallback silencioso
    }
  }

  return (
    <div className="space-y-6">
      <div className="metal-border rounded-2xl p-6">
        <p className="text-sm text-muted-foreground mb-2">Tu link único de afiliado</p>
        <div className="flex items-center gap-3">
          <code className="flex-1 px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-mono text-aff-cyan truncate">
            {link}
          </code>
          <button
            onClick={copy}
            className="btn-aff metal-shine px-5 py-3 text-sm shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Destino del link
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-aff-blue/50 outline-none text-sm"
          >
            {DESTINATIONS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground mt-2">
            El visitante llegará a esta página y la cookie de 30 días registrará la
            atribución.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Sub-ID de campaña <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input
            value={subid}
            onChange={(e) => setSubid(e.target.value)}
            placeholder="ej: instagram-julio"
            maxLength={100}
            className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-aff-blue/50 outline-none text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">
            Usa un sub-ID distinto por cada campaña o red social para medir cuál
            funciona mejor.
          </p>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5 text-sm text-muted-foreground leading-relaxed">
        <p className="font-semibold text-foreground mb-1 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-aff-cyan" /> ¿Cómo funciona el tracking?
        </p>
        Cada persona que haga clic en tu link recibe una cookie de 30 días. Si se
        contacta dentro de ese periodo (formulario o WhatsApp con tu código), el lead
        queda atribuido a ti. Si el proyecto se concreta, generas comisión sobre el
        monto cobrado según tu nivel.
      </div>
    </div>
  );
}
