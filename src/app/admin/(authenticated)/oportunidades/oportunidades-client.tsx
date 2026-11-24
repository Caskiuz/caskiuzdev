"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Briefcase,
  Loader2,
  ExternalLink,
  Sparkles,
  Search,
  Trash2,
  Copy,
  CheckCircle2,
  X,
} from "lucide-react";

interface Opportunity {
  id: number;
  source: string;
  title: string;
  company: string;
  url: string;
  location: string | null;
  salaryText: string | null;
  score: number;
  matchReasons: string | null;
  draftLetter: string | null;
  status: string;
  appliedAt: string | null;
  createdAt: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "Nueva", className: "bg-aff-cyan/10 text-aff-cyan border-aff-cyan/30" },
  APPLIED: { label: "Aplicada", className: "bg-blue-500/10 text-blue-500 border-blue-500/30" },
  INTERVIEW: { label: "Entrevista", className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/30" },
  OFFER: { label: "Oferta 🏆", className: "bg-green-500/10 text-green-500 border-green-500/30" },
  REJECTED: { label: "Rechazada", className: "bg-muted text-muted-foreground border-border" },
  LOST: { label: "Archivada", className: "bg-muted text-muted-foreground border-border" },
};

const STATUS_ACTIONS: { status: string; label: string }[] = [
  { status: "APPLIED", label: "Aplicar" },
  { status: "INTERVIEW", label: "Entrevista" },
  { status: "OFFER", label: "Oferta" },
  { status: "REJECTED", label: "Rechazada" },
  { status: "LOST", label: "Archivar" },
];

const FILTERS = ["ACTIVE", "ALL", "NEW", "APPLIED", "INTERVIEW", "OFFER", "CLOSED"] as const;

export function OportunidadesClient({ opportunities }: { opportunities: Opportunity[] }) {
  const router = useRouter();
  const [items, setItems] = useState(opportunities);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("ACTIVE");
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [draftingId, setDraftingId] = useState<number | null>(null);
  const [expandedDraft, setExpandedDraft] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    if (filter === "ACTIVE") return items.filter((o) => !["REJECTED", "LOST"].includes(o.status));
    if (filter === "CLOSED") return items.filter((o) => ["REJECTED", "LOST"].includes(o.status));
    return items.filter((o) => o.status === filter);
  }, [items, filter]);

  const newCount = items.filter((o) => o.status === "NEW").length;

  async function runSearch() {
    if (running) return;
    setRunning(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run" }),
      });
      const data = await res.json();
      if (res.ok && data.stats) {
        const s = data.stats;
        setMsg(
          `✅ ${s.fetched} vacantes revisadas de las fuentes · ${s.fresh} nuevas · ${s.scored} puntuadas por IA · ${s.inserted} guardadas con match ≥55` +
            (s.error ? ` · ⚠️ ${s.error}` : "")
        );
        router.refresh();
        startTransition(() => router.refresh());
      } else {
        setMsg(`⚠️ ${data.error || "La búsqueda falló"}`);
      }
    } catch {
      setMsg("⚠️ Error de conexión");
    } finally {
      setRunning(false);
      setTimeout(() => setMsg(null), 20000);
    }
  }

  async function setStatus(id: number, status: string) {
    setPendingId(id);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
        startTransition(() => router.refresh());
      }
    } finally {
      setPendingId(null);
    }
  }

  async function draftLetter(id: number) {
    setDraftingId(id);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "draft", id }),
      });
      const data = await res.json();
      if (res.ok && data.letter) {
        setItems((prev) => prev.map((o) => (o.id === id ? { ...o, draftLetter: data.letter } : o)));
        setExpandedDraft(id);
      } else {
        setMsg(`⚠️ ${data.error || "No se pudo generar la carta"}`);
        setTimeout(() => setMsg(null), 12000);
      }
    } catch {
      setMsg("⚠️ Error de conexión");
    } finally {
      setDraftingId(null);
    }
  }

  async function copyLetter(id: number) {
    const item = items.find((o) => o.id === id);
    if (!item?.draftLetter) return;
    try {
      await navigator.clipboard.writeText(item.draftLetter);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      setMsg("No se pudo copiar al portapapeles");
    }
  }

  async function removeItem(id: number) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/opportunities?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((o) => o.id !== id));
        startTransition(() => router.refresh());
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Acciones */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={runSearch}
          disabled={running}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-aff rounded-xl disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Recolectando y puntuando (hasta 60s)…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Buscar vacantes ahora
            </>
          )}
        </button>

        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                filter === f
                  ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "ACTIVE"
                ? `Activas (${items.filter((o) => !["REJECTED", "LOST"].includes(o.status)).length})`
                : f === "ALL"
                  ? `Todas (${items.length})`
                  : f === "NEW"
                    ? `Nuevas (${newCount})`
                    : f === "APPLIED"
                      ? `Aplicadas (${items.filter((o) => o.status === "APPLIED").length})`
                      : f === "INTERVIEW"
                        ? `Entrevistas (${items.filter((o) => o.status === "INTERVIEW").length})`
                        : f === "OFFER"
                          ? `Ofertas (${items.filter((o) => o.status === "OFFER").length})`
                          : `Cerradas (${items.filter((o) => ["REJECTED", "LOST"].includes(o.status)).length})`}
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <p className="text-sm text-muted-foreground bg-surface-hover border border-border rounded-xl px-4 py-2.5">
          {msg}
        </p>
      )}

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {items.length === 0
              ? "Aún no hay vacantes. Usa «Buscar vacantes ahora» o espera el cron diario."
              : "Nada con este filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((o) => {
            const meta = STATUS_META[o.status] ?? STATUS_META.NEW;
            return (
              <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{o.title}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          o.score >= 80
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : o.score >= 65
                              ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
                              : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {o.score}/100
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface border border-border text-muted-foreground">
                        {o.source}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {o.company} · {o.location || "Remoto"}
                      {o.salaryText ? ` · ${o.salaryText}` : ""}
                      {o.appliedAt ? ` · aplicaste ${new Date(o.appliedAt).toLocaleDateString("es")}` : ""}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={o.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Abrir vacante
                    </a>
                    <button
                      onClick={() => (o.draftLetter ? setExpandedDraft(expandedDraft === o.id ? null : o.id) : draftLetter(o.id))}
                      disabled={draftingId === o.id}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-aff-cyan border border-aff-cyan/30 rounded-full hover:bg-aff-cyan/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {draftingId === o.id ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Generando…
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" /> {o.draftLetter ? "Ver carta" : "Generar carta"}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => removeItem(o.id)}
                      disabled={pendingId === o.id}
                      className="p-2 text-muted-foreground hover:text-accent border border-border rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {o.matchReasons && (
                  <p className="text-xs text-muted-foreground mt-3">
                    <span className="font-semibold text-foreground">Por qué: </span>
                    {o.matchReasons}
                  </p>
                )}

                {/* Pipeline */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {STATUS_ACTIONS.filter((a) => a.status !== o.status).map((a) => (
                    <button
                      key={a.status}
                      onClick={() => setStatus(o.id, a.status)}
                      disabled={pendingId === o.id}
                      className="px-3 py-1.5 rounded-full text-[11px] font-medium border border-border text-muted-foreground hover:text-aff-cyan hover:border-aff-cyan/40 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {a.label}
                    </button>
                  ))}
                  {o.status !== "NEW" && (
                    <button
                      onClick={() => setStatus(o.id, "NEW")}
                      disabled={pendingId === o.id}
                      className="p-1.5 text-muted-foreground hover:text-aff-cyan border border-border rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      title="Volver a nueva"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Carta generada */}
                {expandedDraft === o.id && o.draftLetter && (
                  <div className="mt-3 rounded-xl border border-aff-cyan/20 bg-aff-cyan/5 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] uppercase tracking-widest text-aff-cyan font-semibold">
                        Carta de presentación (IA)
                      </p>
                      <button
                        onClick={() => copyLetter(o.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-full border border-aff-cyan/40 text-aff-cyan hover:bg-aff-cyan/10 transition-colors cursor-pointer"
                      >
                        {copiedId === o.id ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> Copiada
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{o.draftLetter}</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
