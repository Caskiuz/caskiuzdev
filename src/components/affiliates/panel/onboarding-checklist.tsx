"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Copy,
  Check,
  X,
  Megaphone,
  Send,
  FileText,
  CreditCard,
  Link2,
} from "lucide-react";
import { TELEGRAM_GROUP_URL } from "@/lib/affiliate-links";

interface OnboardingChecklistProps {
  name: string;
  referralLink: string;
  kycApproved: boolean;
  hasPayoutMethod: boolean;
  hasClicks: boolean;
}

interface Step {
  label: string;
  hint: string;
  href: string;
  done: boolean;
  icon: typeof FileText;
}

/**
 * Ruta de inicio del afiliado: 3 pasos que se marcan solos según el estado
 * real de la cuenta (KYC aprobado, método de pago registrado y primer clic).
 */
export function OnboardingChecklist({
  name,
  referralLink,
  kycApproved,
  hasPayoutMethod,
  hasClicks,
}: OnboardingChecklistProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [hiding, setHiding] = useState(false);

  const steps: Step[] = [
    {
      label: "Sube tu documento de identidad",
      hint: "Desbloquea tus retiros (se aprueba en máx. 72 h)",
      href: "/afiliados/panel/documentos",
      done: kycApproved,
      icon: FileText,
    },
    {
      label: "Registra tu método de pago",
      hint: "Cripto, Pago Móvil, Nequi, Zelle… según tu país",
      href: "/afiliados/panel/comisiones",
      done: hasPayoutMethod,
      icon: CreditCard,
    },
    {
      label: "Comparte tu link único",
      hint: "Se completa solo con tu primer clic",
      href: "/afiliados/panel/enlaces",
      done: hasClicks,
      icon: Link2,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;
  const pct = Math.round((doneCount / steps.length) * 100);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      /* portapapeles no disponible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function hide() {
    setHiding(true);
    try {
      await fetch("/api/affiliate/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: true }),
      });
      router.refresh();
    } catch {
      setHiding(false);
    }
  }

  return (
    <section className="metal-border rounded-2xl p-6 relative">
      <button
        onClick={hide}
        disabled={hiding}
        aria-label="Ocultar ruta de inicio"
        className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        <X className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">🚀</span>
        <div>
          <h2 className="font-bold">Ruta de inicio, {name.split(" ")[0]}</h2>
          <p className="text-xs text-muted-foreground">
            Tres pasos para empezar a ganar. Se marcan solos cuando los completas.
          </p>
        </div>
      </div>

      {/* Progreso */}
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full bg-surface-hover overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-aff-blue-deep via-aff-blue to-aff-cyan transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs font-semibold text-aff-cyan shrink-0">
          {doneCount} de {steps.length}
        </p>
      </div>

      {allDone ? (
        <div className="mt-5 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
          <p className="text-sm font-semibold text-green-500">
            🎉 ¡Estás listo para ganar! Completaste todos los pasos.
          </p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Revisa los materiales promocionales para publicar y únete al grupo de
            Telegram para las clases y anuncios de la red.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              href="/afiliados/panel/materiales"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
            >
              <Megaphone className="w-3.5 h-3.5" /> Ver materiales
            </Link>
            <a
              href={TELEGRAM_GROUP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Grupo de Telegram
            </a>
          </div>
        </div>
      ) : (
        <ol className="mt-5 space-y-3">
          {steps.map((step) => (
            <li
              key={step.label}
              className={`flex items-start gap-3 p-3 rounded-xl border ${
                step.done
                  ? "border-green-500/20 bg-green-500/5"
                  : "border-border bg-surface-hover/50"
              }`}
            >
              <span
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  step.done
                    ? "bg-green-500/15 text-green-500"
                    : "bg-aff-blue/10 text-muted-foreground"
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${step.done ? "text-green-500" : ""}`}>
                  {step.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{step.hint}</p>
                {!step.done && step.href === "/afiliados/panel/enlaces" && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      onClick={copyLink}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copiar mi link
                        </>
                      )}
                    </button>
                    <Link
                      href={step.href}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover transition-colors"
                    >
                      Ir a Mis enlaces
                    </Link>
                  </div>
                )}
                {!step.done && step.href !== "/afiliados/panel/enlaces" && (
                  <Link
                    href={step.href}
                    className="inline-flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs rounded-lg bg-aff-blue/15 text-aff-cyan border border-aff-blue/20 hover:bg-aff-blue/25 transition-colors"
                  >
                    <step.icon className="w-3.5 h-3.5" /> Empezar
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
