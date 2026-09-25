"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Check, X, Wallet } from "lucide-react";

interface WithdrawalRow {
  id: number;
  amount: number;
  netAmount: number;
  status: string;
  txHash: string | null;
  notes: string | null;
  createdAt: string;
  affiliate: { id: number; name: string; email: string };
  payoutMethod: {
    type: string;
    currency: string;
    network: string | null;
    address: string | null;
    binanceId: string | null;
    binanceEmail: string | null;
    pagoMovilPhone?: string | null;
    pagoMovilBank?: string | null;
    pagoMovilHolder?: string | null;
    pagoMovilId?: string | null;
  };
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-500/10 text-yellow-500",
  APPROVED: "bg-aff-blue/10 text-aff-cyan",
  PAID: "bg-green-500/10 text-green-500",
  REJECTED: "bg-accent/10 text-accent",
};

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Solicitado",
  APPROVED: "Aprobado",
  PAID: "Pagado",
  REJECTED: "Rechazado",
};

export function WithdrawalsManager({
  withdrawals,
  usdVesRate,
}: {
  withdrawals: WithdrawalRow[];
  usdVesRate: number | null;
}) {
  const [items, setItems] = useState(withdrawals);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [txInputs, setTxInputs] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function update(id: number, status: "APPROVED" | "PAID" | "REJECTED") {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, txHash: txInputs[id] || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo actualizar el retiro.");
        return;
      }
      setItems((prev) =>
        prev.map((w) => (w.id === id ? { ...w, status, txHash: txInputs[id] || w.txHash } : w))
      );
      flash("ok", status === "PAID" ? "Retiro marcado como pagado ✅" : "Retiro actualizado.");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground">
          No hay retiros solicitados. Cuando un afiliado solicite un retiro aparecerá aquí.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((w) => {
            const method =
              w.payoutMethod.type === "BINANCE_PAY"
                ? `Binance Pay — ${w.payoutMethod.binanceId || w.payoutMethod.binanceEmail}`
                : w.payoutMethod.type === "PAGO_MOVIL"
                  ? `Pago Móvil (BOLÍVARES) — ${w.payoutMethod.pagoMovilPhone} · ${w.payoutMethod.pagoMovilBank} · ${w.payoutMethod.pagoMovilHolder} · ${w.payoutMethod.pagoMovilId}`
                  : `${w.payoutMethod.currency} (${w.payoutMethod.network}) — ${w.payoutMethod.address}`;
            const pending = w.status === "REQUESTED" || w.status === "APPROVED";
            const isPagoMovil = w.payoutMethod.type === "PAGO_MOVIL";
            const vesEquivalent =
              isPagoMovil && usdVesRate ? w.netAmount * usdVesRate : null;

            return (
              <div key={w.id} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-lg">
                      ${w.netAmount.toFixed(2)} USD
                      <span className="ml-2 text-sm font-medium text-muted-foreground">
                        (solicitado: ${w.amount.toFixed(2)})
                      </span>
                    </p>
                    {isPagoMovil && (
                      <p className="text-sm font-semibold text-aff-cyan mt-0.5">
                        📲 Pagar en bolívares
                        {vesEquivalent ? (
                          <>
                            : ≈ Bs {vesEquivalent.toLocaleString("es-VE", { maximumFractionDigits: 2 })}{" "}
                            <span className="text-xs font-normal text-muted-foreground">
                              (tasa {usdVesRate?.toLocaleString("es-VE")} Bs/USD)
                            </span>
                          </>
                        ) : (
                          <span className="text-xs font-normal text-muted-foreground">
                            {" "}(configura la tasa Bs/USD en Ajustes → Métodos de pago)
                          </span>
                        )}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {w.affiliate.name} · {w.affiliate.email}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      <Wallet className="w-3.5 h-3.5 inline mr-1" />
                      {method}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(w.createdAt).toLocaleString("es-ES")}
                      {w.txHash && (
                        <>
                          {" "}· Tx: <code className="font-mono">{w.txHash}</code>
                        </>
                      )}
                    </p>
                    {w.notes && <p className="text-xs text-muted-foreground mt-1">Nota: {w.notes}</p>}
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[w.status] ?? ""}`}>
                    {STATUS_LABELS[w.status] ?? w.status}
                  </span>
                </div>

                {pending && (
                  <div className="mt-4 space-y-3 border-t border-border pt-4">
                    {w.status === "REQUESTED" && (
                      <div className="flex items-center gap-3">
                        <input
                          value={txInputs[w.id] ?? ""}
                          onChange={(e) => setTxInputs((prev) => ({ ...prev, [w.id]: e.target.value }))}
                          placeholder="Hash de transacción / TranId de Binance Pay"
                          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm"
                        />
                        <button
                          onClick={() => update(w.id, "PAID")}
                          disabled={busyId === w.id || !(txInputs[w.id]?.trim())}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50"
                        >
                          {busyId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Marcar pagado
                        </button>
                      </div>
                    )}
                    {w.status === "REQUESTED" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => update(w.id, "APPROVED")}
                          disabled={busyId === w.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-hover disabled:opacity-50"
                        >
                          Aprobar (pagaré después)
                        </button>
                        <button
                          onClick={() => update(w.id, "REJECTED")}
                          disabled={busyId === w.id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" /> Rechazar
                        </button>
                      </div>
                    )}
                    {w.status === "APPROVED" && (
                      <div className="flex items-center gap-3">
                        <input
                          value={txInputs[w.id] ?? ""}
                          onChange={(e) => setTxInputs((prev) => ({ ...prev, [w.id]: e.target.value }))}
                          placeholder="Hash de transacción / TranId"
                          className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border text-sm"
                        />
                        <button
                          onClick={() => update(w.id, "PAID")}
                          disabled={busyId === w.id || !(txInputs[w.id]?.trim())}
                          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-50"
                        >
                          {busyId === w.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          Confirmar pago
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
