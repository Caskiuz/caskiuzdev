"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Send, Headphones } from "lucide-react";

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
  replies: Reply[];
}

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all text-sm";

export function SupportClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = useState<Ticket[]>(initialTickets);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [replyText, setReplyText] = useState<Record<number, string>>({});

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function createTicket(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/affiliate/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: data.get("subject"), message: data.get("message") }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo crear el ticket.");
        return;
      }
      flash("ok", "Ticket creado. Te responderemos pronto.");
      setTickets((prev) => [{ ...json.ticket, replies: [] }, ...prev]);
      setShowForm(false);
      e.currentTarget.reset();
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function replyTicket(ticketId: number) {
    const text = replyText[ticketId]?.trim();
    if (!text) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/affiliate/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo enviar la respuesta.");
        return;
      }
      setReplyText((prev) => ({ ...prev, [ticketId]: "" }));
      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, replies: [...t.replies, json.reply] } : t))
      );
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            message.type === "ok"
              ? "bg-green-500/10 border border-green-500/20 text-green-500"
              : "bg-accent/10 border border-accent/20 text-accent"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          ¿Tienes un problema con tus pagos, enlaces o cuenta? Abre un ticket y te ayudamos.
        </p>
        <button onClick={() => setShowForm(!showForm)} className="btn-aff metal-shine px-5 py-2.5 text-sm">
          <Headphones className="w-4 h-4" /> {showForm ? "Cerrar formulario" : "Nuevo ticket"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createTicket} className="metal-card rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Asunto</label>
            <input name="subject" required maxLength={160} placeholder="Ej: No puedo retirar mi saldo" className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Mensaje</label>
            <textarea
              name="message"
              required
              maxLength={5000}
              rows={4}
              placeholder="Describe tu problema con el mayor detalle posible…"
              className={`${inputClass} resize-none`}
            />
          </div>
          <button type="submit" disabled={busy} className="btn-aff metal-shine px-6 py-3 text-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Enviar ticket
          </button>
        </form>
      )}

      {/* Lista de tickets */}
      {tickets.length === 0 ? (
        <div className="metal-card rounded-2xl p-10 text-center">
          <p className="text-muted-foreground">No tienes tickets. ¡Esperamos que todo vaya bien! 😄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div key={ticket.id} className="metal-card rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="font-bold">{ticket.subject}</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(ticket.createdAt).toLocaleDateString("es-ES", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                    ticket.status === "OPEN" ? "bg-aff-blue/10 text-aff-cyan" : "bg-surface-hover text-muted-foreground"
                  }`}
                >
                  {ticket.status === "OPEN" ? "Abierto" : "Cerrado"}
                </span>
              </div>

              {/* Conversación */}
              <div className="space-y-3 mb-4">
                <div className="rounded-xl bg-surface-hover border border-border p-3.5 text-sm">
                  <p className="text-xs font-semibold text-aff-cyan mb-1">Tú</p>
                  <p className="whitespace-pre-wrap text-muted-foreground">{ticket.message}</p>
                </div>
                {ticket.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-xl border p-3.5 text-sm ${
                      reply.author === "ADMIN"
                        ? "bg-aff-blue/5 border-aff-blue/15 ml-6"
                        : "bg-surface-hover border-border mr-6"
                    }`}
                  >
                    <p className="text-xs font-semibold text-aff-cyan mb-1">
                      {reply.author === "ADMIN" ? "Soporte Caskiuz" : "Tú"}
                    </p>
                    <p className="whitespace-pre-wrap text-muted-foreground">{reply.message}</p>
                  </div>
                ))}
              </div>

              {ticket.status === "OPEN" && (
                <div className="flex gap-2">
                  <input
                    value={replyText[ticket.id] ?? ""}
                    onChange={(e) => setReplyText((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                    placeholder="Escribe tu respuesta…"
                    maxLength={5000}
                    className={`${inputClass} flex-1`}
                  />
                  <button
                    onClick={() => replyTicket(ticket.id)}
                    disabled={busy || !(replyText[ticket.id]?.trim())}
                    className="btn-aff px-4 py-2.5 text-sm shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
