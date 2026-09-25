"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all";

function ResetFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError("");
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      setState("error");
      return;
    }

    try {
      const res = await fetch("/api/affiliate/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo restablecer la contraseña.");
        setState("error");
        return;
      }
      setState("success");
      setTimeout(() => router.push("/afiliados/login?verificado=1"), 2000);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setState("error");
    }
  }

  if (!token) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-12 h-12 text-accent mx-auto mb-4" />
        <p className="text-muted-foreground mb-4">
          Enlace inválido. Solicita uno nuevo desde la página de recuperación.
        </p>
        <Link href="/afiliados/recuperar" className="text-aff-cyan hover:underline text-sm font-medium">
          Solicitar nuevo enlace
        </Link>
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className="text-center py-6">
        <CheckCircle2 className="w-14 h-14 text-aff-cyan mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Contraseña actualizada</h2>
        <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión…</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1.5">
          Nueva contraseña
        </label>
        <input
          id="password" name="password" type="password" required minLength={8}
          placeholder="Mínimo 8 caracteres" className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
          Confirmar contraseña
        </label>
        <input
          id="confirm" name="confirm" type="password" required minLength={8}
          placeholder="Repite la contraseña" className={inputClass}
        />
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
            <Loader2 className="w-5 h-5 animate-spin" /> Guardando…
          </>
        ) : (
          "Guardar nueva contraseña"
        )}
      </button>
    </form>
  );
}

export function ResetForm() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Cargando…</div>}>
      <ResetFormInner />
    </Suspense>
  );
}
