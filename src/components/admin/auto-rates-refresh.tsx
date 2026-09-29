"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";

/**
 * Botón "Actualizar ahora": dispara la descarga de tasas (ruta del cron,
 * autenticada con la cookie de admin) y refresca los datos de la página.
 */
export function AutoRatesRefresh() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [detail, setDetail] = useState("");

  async function refresh() {
    setState("busy");
    setDetail("");
    try {
      const res = await fetch("/api/cron/rates", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setState("error");
        setDetail(json.error || "No se pudo actualizar.");
        return;
      }
      const ves = json.ves?.ok
        ? `Bs ${Number(json.ves.rate).toLocaleString("es-VE", { maximumFractionDigits: 2 })}`
        : "Bs sin dato";
      const cop = json.cop?.ok
        ? `COP ${Number(json.cop.rate).toLocaleString("es-CO", { maximumFractionDigits: 2 })}`
        : "COP sin dato";
      setState("ok");
      setDetail(`${ves} · ${cop}`);
      router.refresh();
    } catch {
      setState("error");
      setDetail("Error de conexión.");
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={refresh}
        disabled={state === "busy"}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors disabled:opacity-60"
      >
        {state === "busy" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        Actualizar ahora
      </button>
      {state === "ok" && <span className="text-sm text-green-500">✓ {detail}</span>}
      {state === "error" && <span className="text-sm text-red-500">{detail}</span>}
    </div>
  );
}
