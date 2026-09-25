"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Send, Archive, RotateCcw } from "lucide-react";

interface Reply {
  id: number;
  author: string;
  message: string;
  createdAt: string;
}

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  affiliate: { id: number; name: string; email: string };
  replies: Reply[];
}

export function TicketsManager({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [replies, setReplies] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function reply(ticketId: number) {
    const text = replies[ticketId]?.trim();
    if (!text) return;
    setBusyId(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo responder.");
        return;
      }
      setReplies((prev) => ({ ...prev, [ticketId]: "" }));
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, replies: [...t.replies, json.reply] } : t))
      );
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  async function toggleStatus(ticketId: number, status: "OPEN" | "CLOSED") {
    setBusyId(ticketId);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        flash("error", "No se pudo actualizar.");
        return;
      }
      setTickets((prev) => prev.map((t) => (t.id === ticketId ? { ...t, status } : t)));
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  const openCount = tickets.filter((t) => t.status === "OPEN").length;

  return (
    <div className="space-y-6">
      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </p>
      )}

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground">
          No hay tickets de soporte todavía.
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold">
                    {ticket.subject}
                    {ticket.status === "OPEN" && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/10 text-yellow-500">
                        ABIERTO
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.affiliate.name} ({ticket.affiliate.email}) ·{" "}
                    {new Date(ticket.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
                <button
                  onClick={() => toggleStatus(ticket.id, ticket.status === "OPEN" ? "CLOSED" : "OPEN")}
                  disabled={busyId === ticket.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-50"
                >
                  {ticket.status === "OPEN" ? (
                    <>
                      <Archive className="w-3.5 h-3.5" /> Cerrar
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 space-y-2">
                <div className="rounded-xl bg-surface-hover border border-border p-3.5 text-sm">
                  <p className="text-xs font-semibold text-primary mb-1">{ticket.affiliate.name}</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{ticket.message}</p>
                </div>
                {ticket.replies.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-3.5 text-sm ${
                      r.author === "ADMIN"
                        ? "bg-primary/5 border-primary/15 ml-6"
                        : "bg-surface-hover border-border mr-6"
                    }`}
                  >
                    <p className="text-xs font-semibold text-primary mb-1">
                      {r.author === "ADMIN" ? "Tú (soporte)" : ticket.affiliate.name}
                    </p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{r.message}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <input
                  value={replies[ticket.id] ?? ""}
                  onChange={(e) => setReplies((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  placeholder="Responder al afiliado…"
                  maxLength={5000}
                  className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm"
                />
                <button
                  onClick={() => reply(ticket.id)}
                  disabled={busyId === ticket.id || !(replies[ticket.id]?.trim())}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50"
                >
                  {busyId === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{openCount} ticket(s) abiertos.</p>
    </div>
  );
}
