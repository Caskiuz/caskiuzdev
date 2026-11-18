"use client";

import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, CheckCircle2 } from "lucide-react";

/**
 * Checklist SEO local gated por email (imán de leads): el visitante deja su
 * correo (suscripción vía /api/subscribe) y desbloquea los 12 puntos con
 * progreso interactivo. La flag vive en localStorage.
 */

const STORAGE_KEY = "caskiuz_magnet_seo";

const ITEMS: { title: string; detail: string }[] = [
  { title: "Perfil de Google Business creado y verificado", detail: "google.com/business — es gratis y es la base de todo el SEO local." },
  { title: "Categoría principal correcta", detail: "Define qué búsquedas te muestran. Sé específico: 'Restaurante', no 'Negocio'." },
  { title: "Nombre real sin trucos", detail: "Añadir 'mejor' o 'barato' al nombre viola las normas de Google y penaliza." },
  { title: "Horarios, teléfono y WhatsApp actualizados", detail: "Los datos inconsistentes entre perfil y web hunden el ranking." },
  { title: "Mínimo 10 fotos reales recientes", detail: "Fotos propias (no de stock) de local, productos y equipo, con nombres de archivo descriptivos." },
  { title: "Link de reseña directo para clientes", detail: "Crea el short-link de reseñas de tu perfil y pídelo tras cada venta feliz." },
  { title: "Responder todas las reseñas", detail: "Buenas y malas. La respuesta pública es señal de actividad para Google." },
  { title: "Tu ciudad y zona en el contenido de tu web", detail: "'Tienda de ropa en Maracaibo zona norte' — sirve a Google y al cliente a la vez." },
  { title: "Página de contacto con dirección embebida", detail: "Dirección física en texto (no solo imagen) + mapa integrado." },
  { title: "Web mobile-first y rápida (<3s)", detail: "La búsqueda local viene del celular: la velocidad es ranking y conversión." },
  { title: "Posts semanales en el perfil de Google", detail: "Publica novedades/ofertas en tu perfil: señal de negocio vivo." },
  { title: "Rutina de reseñas: 2-4 por mes", detail: "Constancia > volumen. 2-4/mes vale más que 20 en una semana." },
];

export function GatedChecklist() {
  const [unlocked, setUnlocked] = useState(false);
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "error">("idle");
  const [checked, setChecked] = useState<number[]>([]);

  useEffect(() => {
    try {
      setUnlocked(localStorage.getItem(STORAGE_KEY) === "1");
    } catch {
      /* sin storage: pide email de nuevo */
    }
  }, []);

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
      if (!res.ok) throw new Error();
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ok igualmente */
      }
      setUnlocked(true);
    } catch {
      setState("error");
    }
  }

  const progress = Math.round((checked.length / ITEMS.length) * 100);

  return (
    <div className="glass-card p-6 sm:p-8">
      <h2 className="text-xl sm:text-2xl font-bold">
        📋 Checklist: SEO local en 12 puntos
      </h2>
      <p className="text-sm text-muted-foreground mt-1 mb-5">
        La guía exacta para aparecer en Google Maps y que te llamen. {unlocked ? "" : "Déjame tu correo y desbloquéala al instante."}
      </p>

      {!unlocked ? (
        <form onSubmit={handleSubmit} className="max-w-md">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
            <Lock className="w-3.5 h-3.5 text-aff-cyan" />
            Se desbloquea gratis con tu correo (también entras al newsletter mensual)
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                maxLength={200}
                required
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={state === "sending"}
              className="px-6 py-3 text-sm font-semibold btn-aff rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {state === "sending" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Desbloquear
            </button>
          </div>
          {/* Honeypot */}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          {state === "error" && (
            <p className="text-xs text-accent mt-2">No se pudo desbloquear. Intenta de nuevo o escríbeme por WhatsApp.</p>
          )}
        </form>
      ) : (
        <div>
          {/* Barra de progreso */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-aff-blue to-aff-cyan transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-aff-cyan">{progress}%</span>
          </div>
          <ul className="space-y-2.5">
            {ITEMS.map((item, i) => {
              const done = checked.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() =>
                      setChecked((prev) => (done ? prev.filter((x) => x !== i) : [...prev, i]))
                    }
                    className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      done ? "border-green-500/30 bg-green-500/5" : "border-border bg-surface hover:border-aff-cyan/40"
                    }`}
                  >
                    <CheckCircle2
                      className={`w-5 h-5 shrink-0 mt-0.5 ${done ? "text-green-500" : "text-muted-foreground/30"}`}
                    />
                    <span className="min-w-0">
                      <span className={`text-sm font-semibold block ${done ? "line-through text-muted-foreground" : ""}`}>
                        {i + 1}. {item.title}
                      </span>
                      <span className="text-xs text-muted-foreground">{item.detail}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {progress === 100 && (
            <p className="text-sm text-green-500 font-medium mt-4 text-center">
              🎉 ¡Checklist completo! Si algo te quedó pendiente por tiempo,{" "}
              <a href="/#contact" className="text-aff-cyan hover:underline font-semibold">
                automatízalo o déjame ayudarte aquí
              </a>
              .
            </p>
          )}
        </div>
      )}
    </div>
  );
}
