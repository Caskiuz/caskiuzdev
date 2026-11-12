"use client";

import { useState } from "react";
import {
  Mail,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Clock,
  UserCheck,
  UserX,
  Loader2,
} from "lucide-react";

interface Message {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  service: string | null;
  message: string;
  read: boolean;
  createdAt: string;
  affiliateId: number | null;
  affiliateName: string | null;
  attributionSource: string | null;
  source: string | null;
  status: string | null;
  score: number | null;
  aiSummary: string | null;
  aiProposal: string | null;
  aiDraftMsg: string | null;
}

interface AffiliateOption {
  id: number;
  name: string;
  email: string;
}

interface Props {
  messages: Message[];
  affiliates: AffiliateOption[];
  markAsRead: (id: number) => Promise<void>;
  markAsUnread: (id: number) => Promise<void>;
}

const ATTRIBUTION_LABELS: Record<string, string> = {
  COOKIE: "Link del afiliado (cookie)",
  CODE: "Código escrito",
  URL: "Link en la URL",
  IP_MATCH: "Rescate por IP (automático)",
  MANUAL: "Asignado por el admin",
};

const SOURCE_LABELS: Record<string, string> = {
  FORM: "Formulario",
  CHAT: "Asistente IA",
  PROSPECT: "Prospección",
  ADMIN: "Manual",
};

const STATUS_OPTIONS = ["NEW", "CONTACTED", "PROPOSAL", "WON", "LOST"] as const;
const STATUS_LABELS: Record<string, string> = {
  NEW: "🆕 Nuevo",
  CONTACTED: "📞 Contactado",
  PROPOSAL: "📨 Propuesta enviada",
  WON: "🎉 Cerrado/ganado",
  LOST: "💀 Perdido",
};

function scoreColor(score: number): string {
  if (score >= 70) return "bg-green-500/10 text-green-500 border-green-500/30";
  if (score >= 40) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
  return "bg-accent/10 text-accent border-accent/30";
}

export function MessageClient({ messages, affiliates, markAsRead, markAsUnread }: Props) {
  const [items, setItems] = useState(messages);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [assigning, setAssigning] = useState<Set<number>>(new Set());
  const [savingStatus, setSavingStatus] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRead = async (id: number, read: boolean) => {
    if (read) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  };

  /** Asigna (o quita) el afiliado del lead vía PATCH /api/admin/contacts/[id]. */
  const handleAssign = async (id: number, affiliateId: number | null) => {
    setAssigning((prev) => new Set(prev).add(id));
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ affiliateId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo asignar el afiliado.");
        return;
      }
      const affiliateName =
        affiliateId === null
          ? null
          : (affiliates.find((a) => a.id === affiliateId)?.name ?? null);
      setItems((prev) =>
        prev.map((m) =>
          m.id === id
            ? {
                ...m,
                affiliateId,
                affiliateName,
                attributionSource: affiliateId === null ? null : "MANUAL",
              }
            : m
        )
      );
    } catch {
      setError("Error de conexión.");
    } finally {
      setAssigning((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  /** Actualiza el estado del pipeline vía PATCH /api/admin/contacts/[id]. */
  const handleStatus = async (id: number, status: string) => {
    setSavingStatus((prev) => new Set(prev).add(id));
    setError(null);
    try {
      const res = await fetch(`/api/admin/contacts/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "No se pudo actualizar el estado.");
        return;
      }
      setItems((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)));
    } catch {
      setError("Error de conexión.");
    } finally {
      setSavingStatus((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (messages.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay mensajes</h3>
        <p className="text-muted-foreground">
          Los mensajes del formulario de contacto aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-sm text-accent flex items-center gap-1.5">
          <UserX className="w-4 h-4" /> {error}
        </p>
      )}

      {items.map((msg) => (
        <div
          key={msg.id}
          className={`glass-card transition-all ${
            !msg.read ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div
            className="p-4 sm:p-5 cursor-pointer flex items-start gap-4"
            onClick={() => toggleExpand(msg.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(msg.id, msg.read);
              }}
              className="mt-0.5 flex-shrink-0"
              title={msg.read ? "Marcar como no leído" : "Marcar como leído"}
            >
              {msg.read ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-primary" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold truncate ${!msg.read ? "text-foreground" : ""}`}>
                  {msg.name}
                </h3>
                <span className="text-xs text-muted-foreground">{msg.email}</span>
                {typeof msg.score === "number" && (
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${scoreColor(msg.score)}`}
                    title="Score de la IA"
                  >
                    {msg.score}/100
                  </span>
                )}
                {msg.service && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border">
                    {msg.service}
                  </span>
                )}
                {msg.source && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-aff-cyan/10 text-aff-cyan border border-aff-cyan/20">
                    {SOURCE_LABELS[msg.source] ?? msg.source}
                  </span>
                )}
                {msg.affiliateId ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                    <UserCheck className="w-3 h-3" /> {msg.affiliateName ?? `Afiliado #${msg.affiliateId}`}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-accent/10 text-accent font-semibold">
                    <UserX className="w-3 h-3" /> Sin afiliado
                  </span>
                )}
              </div>

              {expanded.has(msg.id) ? (
                <div className="mt-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.createdAt).toLocaleString("es-VE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {msg.phone && (
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-border">
                        📱 {msg.phone}
                      </span>
                    )}
                    {msg.attributionSource && (
                      <span className="px-2 py-0.5 rounded-full bg-surface border border-border">
                        Atribución: {ATTRIBUTION_LABELS[msg.attributionSource] ?? msg.attributionSource}
                      </span>
                    )}
                  </div>

                  {/* Intel de la IA */}
                  {(msg.aiSummary || msg.aiProposal || msg.aiDraftMsg) && (
                    <div className="mt-3 rounded-xl border border-aff-cyan/20 bg-aff-cyan/5 p-3.5 space-y-2">
                      <p className="text-[10px] uppercase tracking-widest text-aff-cyan font-semibold">
                        🤖 Inteligencia IA
                      </p>
                      {msg.aiSummary && (
                        <p className="text-xs text-muted-foreground">{msg.aiSummary}</p>
                      )}
                      {msg.aiProposal && (
                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                          <span className="font-semibold text-foreground">Propuesta preliminar: </span>
                          {msg.aiProposal}
                        </p>
                      )}
                      {msg.aiDraftMsg && (
                        <div className="rounded-lg bg-surface border border-border p-2.5">
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground/70 font-semibold mb-1">
                            Primer mensaje WhatsApp listo
                          </p>
                          <p className="text-xs whitespace-pre-wrap">{msg.aiDraftMsg}</p>
                          {msg.phone && (
                            <a
                              href={`https://wa.me/${msg.phone.replace(/\D/g, "")}?text=${encodeURIComponent(msg.aiDraftMsg)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-full transition-colors"
                            >
                              Enviar por WhatsApp
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pipeline del lead */}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <select
                      value={msg.status ?? "NEW"}
                      onChange={(e) => handleStatus(msg.id, e.target.value)}
                      disabled={savingStatus.has(msg.id)}
                      className="text-sm px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-aff-cyan/30 disabled:opacity-60 cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>
                    {savingStatus.has(msg.id) && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Asignación de afiliado */}
                  <div className="mt-3 flex items-center gap-2">
                    <select
                      value={msg.affiliateId ?? ""}
                      onChange={(e) =>
                        handleAssign(
                          msg.id,
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      disabled={assigning.has(msg.id)}
                      className="text-sm px-3 py-2 rounded-lg bg-surface border border-border focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
                    >
                      <option value="">— Sin afiliado —</option>
                      {affiliates.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.email})
                        </option>
                      ))}
                    </select>
                    {assigning.has(msg.id) && (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Al asignarlo, el lead aparece al instante en «Posibles
                    clientes» del afiliado y le llega su notificación.
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {msg.message}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-muted-foreground">
              {expanded.has(msg.id) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
