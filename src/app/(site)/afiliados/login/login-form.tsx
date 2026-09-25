"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

type FormState = "idle" | "submitting" | "error";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all";

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");

  const registrado = searchParams.get("registrado");
  const verificado = searchParams.get("verificado");
  const suspendida = searchParams.get("suspendida");
  const redirectTo = searchParams.get("redirect") || "/afiliados/panel";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("/api/affiliate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo iniciar sesión.");
        setState("error");
        return;
      }
      router.push(redirectTo.startsWith("/afiliados") ? redirectTo : "/afiliados/panel");
      router.refresh();
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <AnimatePresence>
        {registrado && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-aff-blue/10 border border-aff-blue/20 text-sm text-aff-cyan"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            Cuenta creada correctamente. ¡Bienvenido! Inicia sesión para empezar.
          </motion.div>
        )}
        {verificado === "1" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-aff-blue/10 border border-aff-blue/20 text-sm text-aff-cyan"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            Email verificado correctamente.
          </motion.div>
        )}
        {verificado === "0" && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            El enlace de verificación es inválido o expiró.
          </motion.div>
        )}
        {suspendida && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 p-3 rounded-xl bg-accent/10 border border-accent/20 text-sm text-accent"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Tu cuenta está suspendida. Contacta a soporte.
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email
        </label>
        <input id="email" name="email" type="email" required placeholder="tu@email.com" className={inputClass} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="password" className="block text-sm font-medium">
            Contraseña
          </label>
          <Link href="/afiliados/recuperar" className="text-xs text-aff-cyan hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <input
          id="password" name="password" type="password" required
          placeholder="Tu contraseña" className={inputClass}
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
        className="btn-aff metal-shine w-full px-6 py-3.5 text-base disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {state === "submitting" ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Iniciando sesión…
          </>
        ) : (
          <>
            Entrar al panel <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        ¿Aún no tienes cuenta?{" "}
        <Link href="/afiliados/registro" className="text-aff-cyan hover:underline font-medium">
          Regístrate gratis
        </Link>
      </p>
    </form>
  );
}

export function LoginForm() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Cargando…</div>}>
      <LoginFormInner />
    </Suspense>
  );
}
