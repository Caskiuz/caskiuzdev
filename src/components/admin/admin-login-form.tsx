"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Lock, CheckCircle2, ArrowRight, LogOut } from "lucide-react";

function LoginFormFields() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push(redirect);
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-2">
          Contraseña de administrador
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          placeholder="••••••••"
          required
          autoFocus
        />
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Verificando..." : "Ingresar"}
      </button>
    </form>
  );
}

/**
 * Login del admin. Si ya hay una sesión activa (verificada en el servidor)
 * muestra el acceso directo al panel en lugar del formulario.
 */
export function AdminLoginForm({ alreadyAuthenticated }: { alreadyAuthenticated: boolean }) {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(alreadyAuthenticated);

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setLoggedIn(false);
    router.refresh();
  }

  if (loggedIn) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 mb-2">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-2xl font-bold">Sesión de admin activa</h1>
        <p className="text-sm text-muted-foreground">
          Ya estás autenticado. Puedes ir directo al panel.
        </p>
        <Link
          href="/admin"
          className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
        >
          Ir al panel <ArrowRight className="w-4 h-4" />
        </Link>
        <button
          type="button"
          onClick={logout}
          className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Cerrar sesión
        </button>
      </div>
    );
  }

  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
        <Lock className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-2xl font-bold">Panel Admin</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Ingresa la contraseña para acceder
      </p>
      <div className="mt-8 text-left">
        <Suspense
          fallback={
            <div className="text-center text-sm text-muted-foreground py-8">
              Cargando...
            </div>
          }
        >
          <LoginFormFields />
        </Suspense>
      </div>
    </div>
  );
}
