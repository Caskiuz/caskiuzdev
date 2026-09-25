"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all";

export function ForgotForm() {
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError("");
    const data = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/affiliate/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.get("email") }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo procesar la solicitud.");
        setState("error");
        return;
      }
      setState("success");
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-14 h-14 text-aff-cyan mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Revisa tu email</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Si existe una cuenta con ese email, recibirás un enlace para restablecer
          tu contraseña (válido por 1 hora).
        </p>
        <Link href="/afiliados/login" className="text-aff-cyan hover:underline text-sm font-medium">
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email de tu cuenta
        </label>
        <input id="email" name="email" type="email" required placeholder="tu@email.com" className={inputClass} />
      </div>

      {state === "error" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="btn-aff metal-shine w-full px-6 py-3.5 text-base disabled:opacity-60"
      >
        {state === "submitting" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Enviando…
          </>
        ) : (
          "Enviar enlace de recuperación"
        )}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        <Link href="/afiliados/login" className="text-aff-cyan hover:underline">
          Volver al inicio de sesión
        </Link>
      </p>
    </form>
  );
}
