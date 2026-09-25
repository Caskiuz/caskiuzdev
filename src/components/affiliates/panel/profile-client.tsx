"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all text-sm";

interface ProfileData {
  name: string;
  email: string;
  country: string;
  phone: string | null;
  tier: string;
  referralCode: string;
  emailVerified: boolean;
}

export function ProfileClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [country, setCountry] = useState(profile.country);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/affiliate/update-profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          country,
          phone: phone || null,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo guardar.");
        return;
      }
      flash("ok", "Perfil actualizado correctamente.");
      setCurrentPassword("");
      setNewPassword("");
      router.refresh();
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

      <div className="grid lg:grid-cols-3 gap-8 items-start">
        <form onSubmit={handleSubmit} className="lg:col-span-2 metal-card rounded-2xl p-6 space-y-5">
          <h2 className="font-bold">Datos de la cuenta</h2>

          <div>
            <label className="block text-sm font-medium mb-1.5">Email (no editable)</label>
            <input value={profile.email} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
            <p className="text-xs text-muted-foreground mt-1.5">
              {profile.emailVerified
                ? "✅ Email verificado"
                : "Email sin verificar — revisa tu bandeja de entrada"}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nombre completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} className={inputClass} />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">País</label>
              <input value={country} onChange={(e) => setCountry(e.target.value)} required maxLength={80} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Teléfono / WhatsApp</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+58 412 1234567" className={inputClass} />
            </div>
          </div>

          <div className="border-t border-border pt-5">
            <h3 className="font-bold text-sm mb-3">Cambiar contraseña (opcional)</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Contraseña actual</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Nueva contraseña</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  minLength={8}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          <button type="submit" disabled={busy} className="btn-aff metal-shine px-6 py-3 text-sm disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar cambios
          </button>
        </form>

        {/* Resumen lateral */}
        <div className="space-y-4">
          <div className="metal-card rounded-2xl p-5">
            <p className="text-sm text-muted-foreground">Tu código de referido</p>
            <code className="block mt-2 px-3 py-2 rounded-lg bg-surface-hover border border-border font-mono text-aff-cyan">
              {profile.referralCode}
            </code>
            <p className="text-xs text-muted-foreground mt-2">
              Nivel: <strong className="text-foreground">{profile.tier}</strong>
            </p>
          </div>
          <div className="glass-card rounded-2xl p-5 text-xs text-muted-foreground leading-relaxed">
            Los datos de tu cuenta se usan únicamente para el programa de afiliados y los
            pagos de comisiones. Revisa los{" "}
            <a href="/afiliados/terminos" target="_blank" className="text-aff-cyan hover:underline">
              términos
            </a>{" "}
            para más información.
          </div>
        </div>
      </div>
    </div>
  );
}
