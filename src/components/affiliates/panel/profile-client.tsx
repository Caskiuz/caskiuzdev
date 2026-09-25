"use client";

import { useRef, useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Save, Camera, Trash2 } from "lucide-react";
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
  avatar: string | null;
}

/** Recorta en cuadrado centrado y redimensiona a 256px (JPEG ~40KB) */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const size = 256;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("sin contexto 2d");
          const side = Math.min(img.width, img.height);
          const sx = (img.width - side) / 2;
          const sy = (img.height - side) / 2;
          ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("imagen inválida"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("no se pudo leer el archivo"));
    reader.readAsDataURL(file);
  });
}

export function ProfileClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [country, setCountry] = useState(profile.country);
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile.avatar);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flash("error", "Selecciona una imagen (JPG, PNG o WebP).");
      return;
    }
    try {
      const resized = await resizeImage(file);
      setAvatar(resized);
      flash("ok", "Foto lista. Pulsa «Guardar cambios» para aplicarla.");
    } catch {
      flash("error", "No se pudo procesar la imagen.");
    } finally {
      e.target.value = "";
    }
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
          avatar,
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

          {/* Foto de perfil */}
          <div className="flex items-center gap-5 pb-2">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center border-2 border-glass-border shrink-0">
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-2xl">{initials || "C"}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Foto de perfil</p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
                >
                  <Camera className="w-3.5 h-3.5" /> {avatar ? "Cambiar foto" : "Subir foto"}
                </button>
                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar(null)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl text-accent border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Quitar
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPG, PNG o WebP. Se recorta en cuadrado automáticamente.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
            />
          </div>

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
