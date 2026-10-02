"use client";

import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";

/**
 * Reabre la "Ruta de inicio" oculta en el dashboard.
 */
export function ReopenOnboarding() {
  const router = useRouter();

  async function reopen() {
    try {
      await fetch("/api/affiliate/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: false }),
      });
      router.refresh();
    } catch {
      /* error de red — se reintenta al pulsar de nuevo */
    }
  }

  return (
    <button
      onClick={reopen}
      className="inline-flex items-center gap-1 text-xs text-aff-cyan hover:underline"
    >
      <RotateCcw className="w-3 h-3" /> Ver mi ruta de inicio
    </button>
  );
}
