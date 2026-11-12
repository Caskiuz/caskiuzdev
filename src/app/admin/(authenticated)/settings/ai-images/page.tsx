"use client";

import { useState } from "react";
import { ImageIcon, Loader2, Copy, CheckCircle2 } from "lucide-react";

/**
 * Generador de imágenes con IA (Pollinations, gratis, sin API key).
 * Útil para banners, mockups y promos: genera la imagen y da la URL
 * lista para copiar (la URL es estable y cacheable).
 */
export default function AiImagesSettingsPage() {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<"banner" | "square" | "post">("banner");
  const [loading, setLoading] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sizes = {
    banner: { w: 1200, h: 400, label: "Banner (1200×400)" },
    square: { w: 800, h: 800, label: "Cuadrada (800×800)" },
    post: { w: 1200, h: 630, label: "Post/OG (1200×630)" },
  };

  async function generate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setCopied(false);
    const { w, h } = sizes[size];
    const seed = Math.floor(Math.random() * 1000000);
    const url = `/api/ai-image?prompt=${encodeURIComponent(prompt.trim())}&seed=${seed}&w=${w}&h=${h}`;
    // Pre-carga: si falla (cuota/generador caído), avisa en vez de romper la vista
    const img = new window.Image();
    img.onload = () => {
      setSrc(url);
      setLoading(false);
    };
    img.onerror = () => {
      setError("El generador no respondió (¿cuota diaria agotada?). Intenta más tarde.");
      setLoading(false);
    };
    img.src = url;
  }

  async function copyUrl() {
    if (!src) return;
    const full = `${window.location.origin}${src}`;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      setError("No se pudo copiar: " + full);
    }
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Imágenes <span className="gradient-text">IA</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Genera banners, mockups y promos gratis (Pollinations). La URL de cada
          imagen es estable: cópiala y úsala donde quieras.
        </p>
      </div>

      <div className="glass-card p-5 sm:p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Describe la imagen (en cualquier idioma)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            maxLength={400}
            placeholder="Ej: banner moderno de promoción de chatbots de WhatsApp para tiendas, tonos azul oscuro y cian, sin texto"
            className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-border focus:border-aff-cyan outline-none text-sm resize-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-1.5">
            {(Object.keys(sizes) as Array<keyof typeof sizes>).map((k) => (
              <button
                key={k}
                onClick={() => setSize(k)}
                className={`px-3 py-2 rounded-full text-xs font-medium border transition-colors cursor-pointer ${
                  size === k
                    ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {sizes[k].label}
              </button>
            ))}
          </div>
          <button
            onClick={generate}
            disabled={!prompt.trim() || loading}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-aff rounded-xl disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generando…
              </>
            ) : (
              <>
                <ImageIcon className="w-4 h-4" /> Generar imagen
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="text-sm text-accent bg-accent/5 border border-accent/15 rounded-xl p-3">{error}</p>
        )}

        {src && (
          <div className="space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Imagen generada con IA"
              className="w-full rounded-xl border border-border"
            />
            <div className="flex items-center gap-3">
              <button
                onClick={copyUrl}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> ¡URL copiada!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copiar URL
                  </>
                )}
              </button>
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-aff-cyan hover:underline"
              >
                Abrir en pestaña nueva
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
