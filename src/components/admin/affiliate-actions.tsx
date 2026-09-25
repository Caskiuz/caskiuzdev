"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export function AffiliateActions({
  affiliateId,
  currentStatus,
  currentTier,
}: {
  affiliateId: number;
  currentStatus: string;
  currentTier: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [tier, setTier] = useState(currentTier);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, tier }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "No se pudo guardar." });
        return;
      }
      setMessage({ type: "ok", text: "Cambios guardados." });
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setBusy(false);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  const selectClass =
    "px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={selectClass}>
            <option value="PENDING">Pendiente</option>
            <option value="ACTIVE">Activo</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Nivel</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)} className={selectClass}>
            <option value="SILVER">🥈 Plata (10%)</option>
            <option value="GOLD">🥇 Oro (20%)</option>
            <option value="PLATINUM">💎 Platino (30%)</option>
            <option value="DIAMOND">👑 Diamante (40%)</option>
          </select>
        </div>
        <button
          onClick={save}
          disabled={busy}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60 inline-flex items-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
        </button>
      </div>
      {message && (
        <p className={`text-xs flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {message.text}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Nota: el nivel también se actualiza automáticamente por volumen de ventas. Un ajuste manual
        aquí se recalculará en la próxima venta.
      </p>
    </div>
  );
}
