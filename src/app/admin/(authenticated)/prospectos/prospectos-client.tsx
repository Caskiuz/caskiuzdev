"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  MessageCircle,
  X,
  RotateCcw,
  Trash2,
  ExternalLink,
  ChevronDown,
  Save,
  CheckCircle2,
} from "lucide-react";

interface Prospect {
  id: number;
  businessName: string;
  niche: string;
  region: string;
  contactUrl: string | null;
  siteUrl: string | null;
  why: string;
  angle: string;
  draftMessage: string;
  score: number;
  status: string; // NEW | SENT | DISCARDED
  createdAt: string;
}

interface Config {
  prospect_niches: string;
  prospect_region: string;
  prospect_mode: string;
  prospect_volume: string;
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  NEW: { label: "Nuevo", className: "bg-aff-cyan/10 text-aff-cyan border-aff-cyan/30" },
  SENT: { label: "Enviado", className: "bg-green-500/10 text-green-500 border-green-500/30" },
  DISCARDED: { label: "Descartado", className: "bg-muted text-muted-foreground border-border" },
};

export function ProspectosClient({
  prospects,
  config,
}: {
  prospects: Prospect[];
  config: Config;
}) {
  const router = useRouter();
  const [items, setItems] = useState(prospects);
  const [filter, setFilter] = useState<"ALL" | "NEW" | "SENT" | "DISCARDED">("ALL");
  const [running, setRunning] = useState(false);
  const [runMsg, setRunMsg] = useState<string | null>(null);
  const [cfg, setCfg] = useState<Config>(config);
  const [cfgOpen, setCfgOpen] = useState(false);
  const [savingCfg, setSavingCfg] = useState(false);
  const [cfgSaved, setCfgSaved] = useState(false);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "ALL" ? items : items.filter((p) => p.status === filter)),
    [items, filter]
  );
  const newCount = items.filter((p) => p.status === "NEW").length;

  async function runSearch() {
    if (running) return;
    setRunning(true);
    setRunMsg(null);
    try {
      const res = await fetch("/api/admin/prospects", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setRunMsg(`✅ ${data.inserted} prospecto(s) nuevo(s) guardado(s) · modo: ${data.mode}`);
        router.refresh();
        startTransition(() => router.refresh());
      } else {
        setRunMsg(`⚠️ ${data.error || "La búsqueda falló"}`);
      }
    } catch {
      setRunMsg("⚠️ Error de conexión");
    } finally {
      setRunning(false);
      setTimeout(() => setRunMsg(null), 12000);
    }
  }

  async function setStatus(id: number, status: string) {
    setPendingId(id);
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
        startTransition(() => router.refresh());
      }
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(id: number) {
    setPendingId(id);
    try {
      const res = await fetch(`/api/admin/prospects?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setItems((prev) => prev.filter((p) => p.id !== id));
        startTransition(() => router.refresh());
      }
    } finally {
      setPendingId(null);
    }
  }

  async function saveConfig() {
    setSavingCfg(true);
    setCfgSaved(false);
    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [
            { key: "prospect_niches", value: cfg.prospect_niches, group: "prospecting" },
            { key: "prospect_region", value: cfg.prospect_region, group: "prospecting" },
            { key: "prospect_mode", value: cfg.prospect_mode, group: "prospecting" },
            { key: "prospect_volume", value: cfg.prospect_volume, group: "prospecting" },
          ],
        }),
      });
      if (res.ok) {
        setCfgSaved(true);
        setTimeout(() => setCfgSaved(false), 4000);
      }
    } finally {
      setSavingCfg(false);
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
              <Loader2 className="w-4 h-4 animate-spin" /> Buscando con Google + IA (hasta 60s)…
            </>
          ) : (
            <>
              <Search className="w-4 h-4" /> Buscar prospectos ahora
            </>
          )}
        </button>

        <button
          onClick={() => setCfgOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors cursor-pointer"
        >
          Nichos y región
          <ChevronDown className={`w-4 h-4 transition-transform ${cfgOpen ? "rotate-180" : ""}`} />
        </button>

        <div className="flex items-center gap-1.5 ml-auto">
          {(["ALL", "NEW", "SENT", "DISCARDED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                filter === f
                  ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "ALL"
                ? `Todos (${items.length})`
                : f === "NEW"
                  ? `Nuevos (${newCount})`
                  : f === "SENT"
                    ? `Enviados (${items.filter((p) => p.status === "SENT").length})`
                    : `Descartados (${items.filter((p) => p.status === "DISCARDED").length})`}
            </button>
          ))}
        </div>
      </div>

      {runMsg && (
        <p className="text-sm text-muted-foreground bg-surface-hover border border-border rounded-xl px-4 py-2.5">
          {runMsg}
        </p>
      )}

      {/* Editor de nichos */}
      <AnimatePresence>
        {cfgOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-card p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nichos (separados por coma)</label>
                <textarea
                  value={cfg.prospect_niches}
                  onChange={(e) => setCfg({ ...cfg, prospect_niches: e.target.value })}
                  rows={2}
                  placeholder="restaurantes, clínicas dentales, veterinarias, gimnasios…"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm resize-none"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1.5">Región / ciudad</label>
                  <input
                    value={cfg.prospect_region}
                    onChange={(e) => setCfg({ ...cfg, prospect_region: e.target.value })}
                    placeholder="Venezuela, Colombia, Perú…"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Por ronda</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={cfg.prospect_volume}
                    onChange={(e) => setCfg({ ...cfg, prospect_volume: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Modo de búsqueda</label>
                <select
                  value={cfg.prospect_mode}
                  onChange={(e) => setCfg({ ...cfg, prospect_mode: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm cursor-pointer"
                >
                  <option value="mixto">Mixto (rota cada día)</option>
                  <option value="no-web">Solo negocios sin web o web mala</option>
                  <option value="sin-automatizacion">Solo negocios sin automatización/chatbot</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={saveConfig}
                  disabled={savingCfg}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold btn-aff rounded-xl disabled:opacity-60 cursor-pointer"
                >
                  {savingCfg ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Guardar
                </button>
                {cfgSaved && (
                  <span className="text-xs text-green-500 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Guardado
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de prospectos */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {items.length === 0
              ? "Aún no hay prospectos. Usa «Buscar prospectos ahora» o espera el cron diario (13:00 UTC)."
              : "Nada con este filtro."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => {
            const meta = STATUS_META[p.status] ?? STATUS_META.NEW;
            const waHref =
              p.contactUrl?.startsWith("https://wa.me/")
                ? `${p.contactUrl}?text=${encodeURIComponent(p.draftMessage)}`
                : null;
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5"
              >
                <div className="flex flex-wrap items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold">{p.businessName}</h3>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${meta.className}`}
                      >
                        {meta.label}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          p.score >= 70
                            ? "bg-green-500/10 text-green-500 border-green-500/30"
                            : p.score >= 40
                              ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/30"
                              : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {p.score}/100
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {p.niche || "—"} · {p.region} · {new Date(p.createdAt).toLocaleDateString("es")}
                    </p>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-2">
                    {p.status !== "SENT" && (
                      <a
                        href={waHref || p.contactUrl || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!waHref && !p.contactUrl) e.preventDefault();
                          else void setStatus(p.id, "SENT");
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        {waHref ? "Enviar por WhatsApp" : "Abrir contacto"}
                      </a>
                    )}
                    {p.status !== "DISCARDED" && (
                      <button
                        onClick={() => setStatus(p.id, "DISCARDED")}
                        disabled={pendingId === p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-accent border border-border hover:border-accent/40 rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Descartar
                      </button>
                    )}
                    {p.status !== "NEW" && (
                      <button
                        onClick={() => setStatus(p.id, "NEW")}
                        disabled={pendingId === p.id}
                        className="p-2 text-muted-foreground hover:text-aff-cyan border border-border rounded-full transition-colors cursor-pointer disabled:opacity-50"
                        title="Marcar como nuevo"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={() => removeItem(p.id)}
                      disabled={pendingId === p.id}
                      className="p-2 text-muted-foreground hover:text-accent border border-border rounded-full transition-colors cursor-pointer disabled:opacity-50"
                      title="Eliminar definitivamente"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Intel */}
                <div className="mt-4 space-y-3 text-sm">
                  {p.siteUrl && (
                    <a
                      href={p.siteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-aff-cyan hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" /> {p.siteUrl}
                    </a>
                  )}
                  {p.why && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Por qué: </span>
                      {p.why}
                    </p>
                  )}
                  {p.angle && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">Ángulo: </span>
                      {p.angle}
                    </p>
                  )}
                  <div className="rounded-xl border border-border bg-surface-hover/60 p-3.5">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1.5">
                      Mensaje listo para WhatsApp
                    </p>
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{p.draftMessage}</p>
                    {!waHref && p.contactUrl && (
                      <p className="text-[11px] text-muted-foreground mt-2">
                        Contacto: {p.contactUrl}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
