"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Copy, Check } from "lucide-react";

export interface NextStepData {
  title: string;
  text: string;
  cta: string;
  href: string;
  copy: boolean;
}

/**
 * Tarjeta "Tu siguiente paso hoy": una sola acción recomendada según el
 * estado real del afiliado (KYC, método de pago, clics y saldo).
 */
export function NextStepCard({
  step,
  referralLink,
}: {
  step: NextStepData;
  referralLink: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
    } catch {
      /* portapapeles no disponible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center shrink-0">
          <ArrowRight className="w-5 h-5 text-aff-cyan" />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tu siguiente paso hoy
          </p>
          <p className="font-bold">{step.title}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{step.text}</p>
        </div>
      </div>
      {step.copy ? (
        <button onClick={copyLink} className="btn-aff metal-shine px-5 py-2.5 text-sm shrink-0">
          {copied ? (
            <>
              <Check className="w-4 h-4" /> Copiado
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" /> {step.cta}
            </>
          )}
        </button>
      ) : (
        <Link href={step.href} className="btn-aff metal-shine px-5 py-2.5 text-sm shrink-0">
          {step.cta}
        </Link>
      )}
    </div>
  );
}
