"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  FileText,
  Code2,
  Users,
  Globe,
  Briefcase,
  Sparkles,
  Star,
} from "lucide-react";
import { JOB_CHANNELS, CHANNEL_LABELS, buildPitch, type ChannelType } from "@/lib/job-channels";

const TYPE_STYLES: Record<ChannelType, string> = {
  FREELANCE: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  LATAM: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  REMOTO: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  DIRECTO: "bg-amber-500/10 text-amber-400 border-amber-500/30",
};

export function CanalesClient() {
  const [filter, setFilter] = useState<"ALL" | ChannelType>("ALL");
  const [copied, setCopied] = useState<"es" | "en" | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? JOB_CHANNELS : JOB_CHANNELS.filter((c) => c.type === filter)),
    [filter]
  );

  async function copyPitch(lang: "es" | "en") {
    try {
      await navigator.clipboard.writeText(buildPitch(lang));
      setCopied(lang);
      setTimeout(() => setCopied(null), 2500);
    } catch {
      // el navegador puede bloquear clipboard sin HTTPS
    }
  }

  return (
    <div className="space-y-6">
      {/* Kit de postulación */}
      <div className="glass-card p-5 sm:p-6">
        <h2 className="font-bold flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-aff-cyan" /> Kit de postulación
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Todo lo que piden los formularios, a un clic. Copia la presentación en español o inglés.
        </p>
        <div className="flex flex-wrap gap-2">
          <a href="/cv" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors">
            <FileText className="w-3.5 h-3.5" /> CV público
          </a>
          <a href="/images/cv-caskiuz.pdf" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors">
            <FileText className="w-3.5 h-3.5" /> CV en PDF
          </a>
          <a href="https://github.com/Caskiuz" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors">
            <Code2 className="w-3.5 h-3.5" /> GitHub
          </a>
          <a href="https://www.linkedin.com/in/ricardo-agelvis-9489a9370" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors">
            <Users className="w-3.5 h-3.5" /> LinkedIn
          </a>
          <a href="https://torre.ai/ricardojoseagelvisrequiniva" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors">
            <Globe className="w-3.5 h-3.5" /> Torre
          </a>
          <button
            onClick={() => copyPitch("es")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold btn-aff rounded-full cursor-pointer"
          >
            {copied === "es" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === "es" ? "Copiado" : "Copiar presentación ES"}
          </button>
          <button
            onClick={() => copyPitch("en")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border border-border hover:bg-surface-hover transition-colors cursor-pointer"
          >
            {copied === "en" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied === "en" ? "Copiado" : "Copiar presentación EN"}
          </button>
        </div>
        <div className="mt-4 rounded-xl bg-surface border border-border p-3 text-[11px] text-muted-foreground leading-relaxed">
          <strong className="text-foreground">Rutina diaria sugerida:</strong> 3 postulaciones en canales prioritarios + 10 mensajes de WhatsApp/Telegram desde el panel de Prospectos + revisar las vacantes nuevas del hub. 30-45 minutos y el motor sigue corriendo solo.
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-1.5">
        {(["ALL", "FREELANCE", "LATAM", "REMOTO", "DIRECTO"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
              filter === t
                ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "ALL" ? `Todos (${JOB_CHANNELS.length})` : `${CHANNEL_LABELS[t]} (${JOB_CHANNELS.filter((c) => c.type === t).length})`}
          </button>
        ))}
      </div>

      {/* Canales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered
          .slice()
          .sort((a, b) => b.priority - a.priority)
          .map((c) => (
            <a
              key={c.name}
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="glass-card p-4 group hover:border-aff-cyan/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm group-hover:text-aff-cyan transition-colors flex items-center gap-1.5">
                    {c.name}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${TYPE_STYLES[c.type]}`}>
                      {CHANNEL_LABELS[c.type]}
                    </span>
                    <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                      {Array.from({ length: c.priority }).map((_, i) => (
                        <Star key={i} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                      ))}
                    </span>
                  </div>
                </div>
                <Briefcase className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed">{c.note}</p>
            </a>
          ))}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Todos los canales de esta lista permiten crear perfil y postularse gratis. Los de prioridad 3 son los que
        mejor encajan con tu perfil; empieza por esos.
      </p>
    </div>
  );
}
