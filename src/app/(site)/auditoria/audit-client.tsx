"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  ShieldCheck,
  Gauge,
  Smartphone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface AuditIssue {
  severity: "alta" | "media" | "baja";
  title: string;
  detail: string;
  fix: string;
}

interface AuditResult {
  url: string;
  score: number;
  grade: string;
  metrics: {
    https: boolean;
    ttfbMs: number;
    totalMs: number;
    htmlKb: number;
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    h1Count: number;
    images: number;
    imagesNoAlt: number;
    schemaTypes: string[];
    hasWhatsApp: boolean;
    hasAnalytics: boolean;
    hasViewport: boolean;
    hasCanonical: boolean;
    tech: string[];
  };
  issues: AuditIssue[];
}

const SEVERITY_STYLES: Record<string, string> = {
  alta: "border-red-500/30 bg-red-500/5 text-red-400",
  media: "border-amber-500/30 bg-amber-500/5 text-amber-400",
  baja: "border-sky-500/30 bg-sky-500/5 text-sky-400",
};

const WHATSAPP = "584262931869";

export function AuditClient({ initialUrl = "" }: { initialUrl?: string }) {
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAudit = useCallback(async (target: string) => {
    const clean = target.trim();
    if (!clean) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "No se pudo auditar la web.");
      } else {
        setResult(data as AuditResult);
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialUrl) void runAudit(initialUrl);
  }, [initialUrl, runAudit]);

  const topIssues = result?.issues
    .filter((i) => i.severity === "alta")
    .slice(0, 3)
    .map((i) => i.title)
    .join(", ");
  const waMessage = result
    ? `Hola Ricardo, audité ${result.url} en tu herramienta y salió ${result.score}/100 (${result.grade}). Me interesa corregir: ${topIssues || result.issues[0]?.title || "los puntos del informe"}. ¿Me pasas una propuesta?`
    : "";

  return (
    <div className="space-y-8">
      {/* Formulario */}
      <div className="glass-card spotlight-card p-6 sm:p-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runAudit(url);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="tunegocio.com"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm"
              aria-label="URL de tu web"
              inputMode="url"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold btn-aff rounded-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analizando…
              </>
            ) : (
              <>
                <Gauge className="w-4 h-4" /> Auditar gratis
              </>
            )}
          </button>
        </form>
        <p className="text-[11px] text-muted-foreground mt-3">
          Sin registro. Solo se analiza la página pública que escribas; no guardamos la URL.
        </p>
        {error && (
          <p className="mt-4 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3">
            ⚠️ {error}
          </p>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="space-y-6">
          <div className="glass-card spotlight-card p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 120 120" className="w-32 h-32 -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-border" />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - result.score / 100)}
                    className={
                      result.score >= 75
                        ? "stroke-green-500"
                        : result.score >= 50
                          ? "stroke-amber-500"
                          : "stroke-red-500"
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{result.score}</span>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground">/100</span>
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                  Resultado de la auditoría
                </p>
                <h2 className="text-2xl font-bold mt-1">
                  {result.grade} <span className="text-muted-foreground font-normal text-base">· {result.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}</span>
                </h2>
                <p className="text-sm text-muted-foreground mt-2">
                  Encontramos <strong className="text-foreground">{result.issues.length} puntos de mejora</strong>. Los de
                  severidad alta son los que más te están costando clientes.
                </p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-4">
                  <a
                    href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(waMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-xl transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" /> Quiero que lo arregles
                  </a>
                  <Link
                    href="/#contact"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
                  >
                    Pedir propuesta <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-6">
              {[
                { icon: ShieldCheck, label: "HTTPS", value: result.metrics.https ? "Sí" : "No" },
                { icon: Gauge, label: "Respuesta", value: `${(result.metrics.ttfbMs / 1000).toFixed(1)}s` },
                { icon: Smartphone, label: "Móvil", value: result.metrics.hasViewport ? "Adaptable" : "No" },
                { icon: MessageCircle, label: "WhatsApp", value: result.metrics.hasWhatsApp ? "Visible" : "Ausente" },
              ].map((m) => (
                <div key={m.label} className="rounded-xl bg-surface border border-border p-3 text-center">
                  <m.icon className="w-4 h-4 mx-auto text-aff-cyan" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1.5">{m.label}</p>
                  <p className="text-sm font-semibold">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Hallazgos */}
          <div className="space-y-3">
            {result.issues.map((issue) => (
              <div
                key={issue.title}
                className={`rounded-xl border p-4 ${SEVERITY_STYLES[issue.severity]}`}
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {issue.title}
                      <span className="ml-2 text-[10px] uppercase tracking-wider font-bold">
                        {issue.severity}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{issue.detail}</p>
                    <p className="text-xs text-foreground/80 mt-2">
                      <span className="font-semibold">Cómo se arregla: </span>
                      {issue.fix}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.issues.length === 0 && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5 text-sm text-green-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> ¡Muy bien! No encontramos problemas graves. Aun así, siempre
              se puede optimizar la conversión y la velocidad.
            </div>
          )}

          {result.metrics.tech.length > 0 && (
            <p className="text-[11px] text-muted-foreground">
              Tecnología detectada: {result.metrics.tech.join(" · ")}. Schema:{" "}
              {result.metrics.schemaTypes.length ? result.metrics.schemaTypes.join(", ") : "ninguno"}.
            </p>
          )}
        </div>
      )}

      {/* Qué revisa (antes de auditar) */}
      {!result && !loading && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              icon: Gauge,
              title: "Velocidad real",
              text: "Tiempo de respuesta del servidor y peso del HTML: lo que Google mide en Core Web Vitals.",
            },
            {
              icon: Search,
              title: "SEO on-page",
              text: "Título, meta descripción, H1, canónica, Schema.org y Open Graph para aparecer mejor.",
            },
            {
              icon: Smartphone,
              title: "Conversión",
              text: "Botón de WhatsApp, adaptación móvil y analítica: lo que convierte visitas en clientes.",
            },
          ].map((c) => (
            <div key={c.title} className="glass-card p-5">
              <c.icon className="w-5 h-5 text-aff-cyan mb-2" />
              <p className="font-semibold text-sm">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-aff-cyan" />
        Herramienta gratuita de Caskiuz. Si quieres, reviso el informe contigo y te digo qué priorizar.
      </div>
    </div>
  );
}
