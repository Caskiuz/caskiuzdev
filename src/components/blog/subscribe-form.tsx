"use client";

import { useState } from "react";
import { Loader2, Send, CheckCircle2 } from "lucide-react";

/** Formulario de suscripción al newsletter (conecta con /api/subscribe). */
export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [msg, setMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || state === "sending") return;
    setState("sending");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website: "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Error");
      setMsg(data.message || "¡Listo! Revisa tu bandeja 📬");
      setState("done");
      setEmail("");
      setTimeout(() => setState("idle"), 8000);
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Error al suscribirse");
      setState("error");
      setTimeout(() => setState("idle"), 5000);
    }
  }

  return (
    <div>
      {state === "done" ? (
        <p className="flex items-center justify-center gap-2 text-sm text-green-500 font-medium">
          <CheckCircle2 className="w-4 h-4" /> {msg}
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            maxLength={200}
            className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
            required
          />
          {/* Honeypot anti-bots: invisible para humanos */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />
          <button
            type="submit"
            disabled={state === "sending"}
            className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-lg shadow-primary/25 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {state === "sending" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Suscribirme
              </>
            )}
          </button>
        </form>
      )}
      {state === "error" && <p className="text-xs text-accent mt-2 text-center">{msg}</p>}
    </div>
  );
}
