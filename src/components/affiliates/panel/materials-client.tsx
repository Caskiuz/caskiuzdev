"use client";

import { useState, useSyncExternalStore } from "react";
import {
  Check,
  Copy,
  MessageCircle,
  Share2,
  Send,
  Video,
  Mail,
  MessageSquare,
  RefreshCw,
  Shield,
  Palette,
  Lightbulb,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  MATERIAL_SECTIONS,
  OBJECTIONS,
  PROMO_BANNER,
  PROMO_TIPS,
} from "@/lib/affiliate-materials";

const emptySubscribe = () => () => {};

/** Origen del sitio (solo en el navegador, sin desajuste de hidratación) */
function useOrigin(): string {
  return useSyncExternalStore(
    emptySubscribe,
    () => window.location.origin,
    () => ""
  );
}

const SECTION_ICONS: Record<string, LucideIcon> = {
  whatsapp: MessageCircle,
  instagram: Share2,
  twitter: Send,
  video: Video,
  email: Mail,
  dm: MessageSquare,
  followup: RefreshCw,
};

function CopyButton({
  id,
  text,
  copied,
  onCopy,
}: {
  id: string;
  text: string;
  copied: boolean;
  onCopy: (id: string, text: string) => void;
}) {
  return (
    <button
      onClick={() => onCopy(id, text)}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-surface-hover transition-colors shrink-0"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-aff-cyan" /> Copiado
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" /> Copiar
        </>
      )}
    </button>
  );
}

export function MaterialsClient({ referralCode }: { referralCode: string }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const origin = useOrigin();

  const link = origin ? `${origin}/r/${referralCode}` : "";
  const withLink = (text: string) =>
    link ? text.replaceAll("[TU LINK]", link) : text;

  async function copy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(withLink(text));
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // sin clipboard: ignorar
    }
  }

  return (
    <div className="space-y-10">
      {/* Accesos rápidos por canal */}
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold text-muted-foreground self-center mr-1">
          ¿Dónde quieres promocionar?
        </p>
        {MATERIAL_SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() =>
              document
                .getElementById(`mat-${section.id}`)
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="px-3 py-1.5 text-xs rounded-full border border-border hover:bg-surface-hover hover:text-aff-cyan transition-colors"
          >
            {section.title}
          </button>
        ))}
      </div>

      {/* Materiales por canal */}
      {MATERIAL_SECTIONS.map((section) => {
        const Icon = SECTION_ICONS[section.icon] ?? MessageCircle;
        return (
          <section key={section.id} id={`mat-${section.id}`} className="scroll-mt-24">
            <div className="flex items-center gap-2 mb-1">
              <Icon className="w-5 h-5 text-aff-cyan" />
              <h2 className="text-lg font-bold">{section.title}</h2>
            </div>
            {section.subtitle && (
              <p className="text-sm text-muted-foreground mb-4">{section.subtitle}</p>
            )}
            <div className="grid lg:grid-cols-2 gap-5">
              {section.materials.map((material) => (
                <div
                  key={material.id}
                  className="metal-card rounded-2xl p-5 flex flex-col"
                >
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-aff-blue/15 text-aff-cyan">
                      {material.variant}
                    </span>
                    <CopyButton
                      id={material.id}
                      text={material.text}
                      copied={copiedId === material.id}
                      onCopy={copy}
                    />
                  </div>
                  <pre className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed bg-surface-hover border border-border rounded-xl p-4 font-sans">
                    {withLink(material.text)}
                  </pre>
                </div>
              ))}
            </div>
            {section.note && (
              <p className="text-xs text-muted-foreground mt-3">{section.note}</p>
            )}
          </section>
        );
      })}

      {/* Respuestas a objeciones */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-aff-cyan" />
          <h2 className="text-lg font-bold">Respuestas a objeciones</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Qué responder cuando el prospecto pone una excusa. Nunca des precios por
          chat: el presupuesto lo hace Caskiuz.
        </p>
        <div className="grid lg:grid-cols-2 gap-5">
          {OBJECTIONS.map((objection) => (
            <div key={objection.id} className="metal-card rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-3 mb-3">
                <p className="text-sm font-semibold text-aff-cyan">
                  Si te dicen: «{objection.objection}»
                </p>
                <CopyButton
                  id={objection.id}
                  text={objection.response}
                  copied={copiedId === objection.id}
                  onCopy={copy}
                />
              </div>
              <pre className="flex-1 whitespace-pre-wrap text-xs text-muted-foreground leading-relaxed bg-surface-hover border border-border rounded-xl p-4 font-sans">
                {withLink(objection.response)}
              </pre>
            </div>
          ))}
        </div>
      </section>

      {/* Banner guía */}
      <section>
        <div className="flex items-center gap-2 mb-1">
          <Palette className="w-5 h-5 text-aff-cyan" />
          <h2 className="text-lg font-bold">Banner sugerido (HTML/CSS)</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Usa este estilo en tu web o blog. El link se inserta automáticamente al copiar:
        </p>
        <div className="metal-card rounded-2xl p-6">
          <div className="flex justify-end mb-3">
            <CopyButton
              id="banner"
              text={PROMO_BANNER}
              copied={copiedId === "banner"}
              onCopy={copy}
            />
          </div>
          <pre className="whitespace-pre-wrap text-xs leading-relaxed bg-surface-hover border border-border rounded-xl p-4 font-mono text-aff-cyan overflow-x-auto">
            {withLink(PROMO_BANNER)}
          </pre>
        </div>
      </section>

      {/* Tips */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-aff-cyan" />
          <h2 className="text-lg font-bold">Tips de promoción</h2>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <ul className="space-y-3">
            {PROMO_TIPS.map((tip, i) => (
              <li
                key={i}
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
