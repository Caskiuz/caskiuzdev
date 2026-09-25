"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

type FormState = "idle" | "submitting" | "success" | "error";

const COUNTRIES = [
  "Argentina", "Bolivia", "Chile", "Colombia", "Costa Rica", "Cuba",
  "Ecuador", "El Salvador", "España", "Estados Unidos", "Guatemala",
  "Honduras", "México", "Nicaragua", "Panamá", "Paraguay", "Perú",
  "Puerto Rico", "República Dominicana", "Uruguay", "Venezuela", "Otro",
];

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all";

export function RegisterForm() {
  const router = useRouter();
  const [state, setState] = useState<FormState>("idle");
  const [error, setError] = useState("");
  const [referralCode, setReferralCode] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("submitting");
    setError("");

    const form = e.currentTarget;
    const data = new FormData(form);
    const password = String(data.get("password") || "");
    const confirm = String(data.get("confirm") || "");

    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      setState("error");
      return;
    }

    try {
      const res = await fetch("/api/affiliate/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          password,
          country: data.get("country"),
          phone: data.get("phone") || null,
          acceptsTerms: data.get("terms") === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "No se pudo crear la cuenta.");
        setState("error");
        return;
      }
      setReferralCode(json.referralCode || "");
      setState("success");
      setTimeout(() => router.push(`/afiliados/login?registrado=1`), 2200);
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.");
      setState("error");
    }
  }

  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="metal-card rounded-2xl p-8 text-center"
      >
        <CheckCircle2 className="w-14 h-14 text-aff-cyan mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">¡Cuenta creada! 🎉</h2>
        <p className="text-muted-foreground mb-4">
          Tu código de referido es{" "}
          <code className="px-2 py-1 rounded bg-surface-hover border border-border font-mono text-aff-cyan">
            {referralCode}
          </code>
        </p>
        <p className="text-sm text-muted-foreground">Redirigiendo al inicio de sesión…</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1.5">
          Nombre completo <span className="text-accent">*</span>
        </label>
        <input id="name" name="name" required maxLength={120} placeholder="Tu nombre y apellido" className={inputClass} />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1.5">
          Email <span className="text-accent">*</span>
        </label>
        <input id="email" name="email" type="email" required placeholder="tu@email.com" className={inputClass} />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Contraseña <span className="text-accent">*</span>
          </label>
          <input
            id="password" name="password" type="password" required minLength={8}
            placeholder="Mínimo 8 caracteres" className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium mb-1.5">
            Confirmar contraseña <span className="text-accent">*</span>
          </label>
          <input
            id="confirm" name="confirm" type="password" required minLength={8}
            placeholder="Repite la contraseña" className={inputClass}
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="country" className="block text-sm font-medium mb-1.5">
            País <span className="text-accent">*</span>
          </label>
          <select id="country" name="country" required defaultValue="" className={inputClass}>
            <option value="" disabled>Selecciona tu país</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium mb-1.5">
            Teléfono / WhatsApp <span className="text-muted-foreground">(opcional)</span>
          </label>
          <input id="phone" name="phone" placeholder="+58 412 1234567" className={inputClass} />
        </div>
      </div>

      <label className="flex items-start gap-3 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          name="terms"
          required
          className="mt-1 w-4 h-4 rounded border-border bg-surface accent-aff-blue"
        />
        <span>
          Acepto los{" "}
          <Link href="/afiliados/terminos" target="_blank" className="text-aff-cyan hover:underline">
            Términos y Condiciones
          </Link>{" "}
          del programa de afiliados y la política de privacidad.{" "}
          <span className="text-accent">*</span>
          <span className="block text-xs text-muted-foreground mt-1">
            Al crear tu cuenta se celebra el contrato del programa de afiliados, que rige
            comisiones, niveles y pagos.
          </span>
        </span>
      </label>

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
            <Loader2 className="w-5 h-5 animate-spin" /> Creando cuenta…
          </>
        ) : (
          <>
            Crear cuenta gratis <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>

      <p className="text-sm text-center text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/afiliados/login" className="text-aff-cyan hover:underline font-medium">
          Inicia sesión
        </Link>
      </p>
    </form>
  );
}
