"use client";

import { useState } from "react";
import { Check, Copy, MessageCircle, Share2, Send, Video, Mail } from "lucide-react";

interface Swipe {
  id: string;
  icon: typeof MessageCircle;
  channel: string;
  text: string;
}

const SWIPES: Swipe[] = [
  {
    id: "wa1",
    icon: MessageCircle,
    channel: "WhatsApp",
    text: "🚀 ¿Tienes un negocio y necesitas página web, app o tienda online?\n\nTrabajo con Caskiuz, un desarrollador que entrega proyectos en tiempo récord y con calidad profesional. Web Apps desde $349, tiendas online desde $999.\n\nPuedes pagar con Pago Móvil (Venezuela), transferencia, PayPal, Binance o MercadoPago, 50% para empezar.\n\nTe dejo el enlace con más info 👇\n[TU LINK]",
  },
  {
    id: "ig1",
    icon: Share2,
    channel: "Instagram / Facebook",
    text: "💼 Convierte tu idea en un negocio digital.\n\nLanding pages desde $149 · E-commerce desde $999 · Apps desde $799 · SEO desde $199.\n\nLink en mi bio 👆 #desarrolloweb #emprendimiento #negociosdigitales",
  },
  {
    id: "tw1",
    icon: Send,
    channel: "Twitter / X",
    text: "Si tienes un negocio y todavía no tienes web, estás perdiendo clientes. 🧵\n\nCaskiuz desarrolla webs, apps y e-commerce con entrega rápida desde $149.\n\nMás info: [TU LINK]",
  },
  {
    id: "yt1",
    icon: Video,
    channel: "YouTube / TikTok (guion)",
    text: "🎬 Hook: \"Tu negocio pierde ventas todos los días por no tener web.\"\n\nCuerpo: muestra 3 ejemplos de lo que Caskiuz construye (web, e-commerce, SEO) con precios en pantalla.\n\nCTA: \"Link en la descripción para cotizar gratis.\"",
  },
  {
    id: "email1",
    icon: Mail,
    channel: "Email frío",
    text: "Hola [Nombre],\n\nNoté que [negocio] no tiene presencia online optimizada. Una landing page profesional desde $149 puede empezar a traerte clientes esta misma semana.\n\nTrabajo con Caskiuz, desarrollador full-stack con entregas rápidas y garantía de calidad.\n\n¿Te interesa una cotización gratis? 👉 [TU LINK]",
  },
];

const TIPS = [
  "Publica en horarios de mayor actividad de tu audiencia (mañana 8-10am o noche 7-9pm).",
  "Cuenta una historia personal: por qué confías en el servicio y qué resultado puede esperar tu cliente.",
  "Usa un sub-ID distinto por red social para medir qué canal te da más ventas.",
  "El 80% del resultado está en la constancia: publica al menos 3 veces por semana.",
  "Comparte casos de éxito reales de proyectos terminados (los encuentras en la página principal).",
];

export function MaterialsClient({ referralCode }: { referralCode: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const link = `https://caskiuz.vercel.app/r/${referralCode}`;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text.replace("[TU LINK]", link));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // sin clipboard: ignorar
    }
  }

  return (
    <div className="space-y-8">
      {/* Swipes */}
      <div className="grid lg:grid-cols-2 gap-5">
        {SWIPES.map((swipe) => (
          <div key={swipe.id} className="metal-card rounded-2xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <swipe.icon className="w-4 h-4 text-aff-cyan" /> {swipe.channel}
              </p>
              <button
                onClick={() => copy(swipe.id, swipe.text)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors"
              >
                {copiedId === swipe.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-aff-cyan" /> Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copiar
                  </>
                )}
              </button>
            </div>
            <pre className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed bg-surface-hover border border-border rounded-xl p-4 font-sans">
              {swipe.text}
            </pre>
          </div>
        ))}
      </div>

      {/* Banner guía */}
      <div className="metal-card rounded-2xl p-6">
        <h2 className="font-bold mb-3">🎨 Banner sugerido (HTML/CSS)</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Usa este estilo en tu web o blog. Solo reemplaza [TU LINK]:
        </p>
        <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-surface-hover border border-border rounded-xl p-4 font-mono text-aff-cyan overflow-x-auto">
{`<a href="[TU LINK]" style="display:inline-block;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#1e3a8a,#0ea5e9);color:#fff;font-weight:700;font-family:sans-serif;text-decoration:none;">
  🚀 ¿Necesitas una web profesional? Cotiza gratis
</a>`}
        </pre>
      </div>

      {/* Tips */}
      <div className="glass-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">💡 Tips de promoción</h2>
        <ul className="space-y-3">
          {TIPS.map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
