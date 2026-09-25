"use client";

import { useState } from "react";
import { Loader2, AlertCircle, CheckCircle2, Trash2, Wallet, Coins, Smartphone } from "lucide-react";
import { SUPPORTED_CURRENCIES, NETWORK_LABELS, MIN_WITHDRAWAL, formatUsd } from "@/lib/affiliate";
import { getWithdrawalStatusLabel } from "@/lib/affiliate-queries";
import Link from "next/link";

interface PayoutMethod {
  id: number;
  type: string;
  binanceId: string | null;
  binanceEmail: string | null;
  currency: string;
  network: string | null;
  address: string | null;
  label: string | null;
  isDefault: boolean;
  pagoMovilPhone?: string | null;
  pagoMovilBank?: string | null;
  pagoMovilHolder?: string | null;
  pagoMovilId?: string | null;
}

interface Withdrawal {
  id: number;
  amount: number;
  netAmount: number;
  status: string;
  txHash: string | null;
  notes: string | null;
  createdAt: string;
  paidAt: string | null;
  payoutMethod: {
    type: string;
    currency: string;
    network: string | null;
    address: string | null;
    binanceId: string | null;
    binanceEmail: string | null;
    label: string | null;
  };
}

interface WithdrawalsProps {
  country: string;
  initialBalanceAvailable: number;
  initialBalancePending: number;
  initialKycApproved: boolean;
  initialMethods: PayoutMethod[];
  initialWithdrawals: Withdrawal[];
}

type MethodForm =
  | { mode: "closed" }
  | { mode: "binance" }
  | { mode: "wallet" }
  | { mode: "pago-movil" };

const inputClass =
  "w-full px-4 py-2.5 rounded-xl bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-aff-blue/50 transition-all text-sm";

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "bg-yellow-500/10 text-yellow-500",
  APPROVED: "bg-aff-blue/10 text-aff-cyan",
  PAID: "bg-green-500/10 text-green-500",
  REJECTED: "bg-accent/10 text-accent",
};

export function WithdrawalsClient({
  country,
  initialBalanceAvailable,
  initialBalancePending,
  initialKycApproved,
  initialMethods,
  initialWithdrawals,
}: WithdrawalsProps) {
  const isVenezuela = country === "Venezuela";
  const [balanceAvailable, setBalanceAvailable] = useState(initialBalanceAvailable);
  const balancePending = initialBalancePending;
  const kycApproved = initialKycApproved;
  const [methods, setMethods] = useState<PayoutMethod[]>(initialMethods);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>(initialWithdrawals);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  // Formulario de método nuevo
  const [form, setForm] = useState<MethodForm>({ mode: "closed" });
  const [binanceField, setBinanceField] = useState("");
  const [binanceType, setBinanceType] = useState<"BINANCE_ID" | "BINANCE_EMAIL">("BINANCE_ID");
  const [currency, setCurrency] = useState("USDT");
  const [network, setNetwork] = useState("");
  const [address, setAddress] = useState("");
  const [pmPhone, setPmPhone] = useState("");
  const [pmBank, setPmBank] = useState("");
  const [pmHolder, setPmHolder] = useState("");
  const [pmId, setPmId] = useState("");

  // Formulario de retiro
  const [withdrawMethod, setWithdrawMethod] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState("");

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function addMethod(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const payload =
        form.mode === "binance"
          ? {
              type: "BINANCE_PAY",
              binanceId: binanceType === "BINANCE_ID" ? binanceField : null,
              binanceEmail: binanceType === "BINANCE_EMAIL" ? binanceField : null,
            }
          : form.mode === "pago-movil"
            ? {
                type: "PAGO_MOVIL",
                pagoMovilPhone: pmPhone,
                pagoMovilBank: pmBank,
                pagoMovilHolder: pmHolder,
                pagoMovilId: pmId,
              }
            : { type: "WALLET", currency, network, address };

      const res = await fetch("/api/affiliate/payout-methods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo guardar el método.");
        return;
      }
      flash("ok", "Método de pago agregado correctamente.");
      setMethods((prev) => [...prev, json.method]);
      setForm({ mode: "closed" });
      setBinanceField("");
      setAddress("");
      setPmPhone("");
      setPmBank("");
      setPmHolder("");
      setPmId("");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function removeMethod(id: number) {
    if (!confirm("¿Eliminar este método de pago?")) return;
    try {
      const res = await fetch(`/api/affiliate/payout-methods?id=${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo eliminar.");
        return;
      }
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch {
      flash("error", "Error de conexión.");
    }
  }

  async function requestWithdrawal(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/affiliate/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutMethodId: Number(withdrawMethod), amount: Number(withdrawAmount) }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo solicitar el retiro.");
        return;
      }
      flash("ok", "Retiro solicitado. Te pagaremos en un máximo de 7 días hábiles.");
      setWithdrawals((prev) => [json.withdrawal, ...prev]);
      setBalanceAvailable((prev) => Math.max(0, prev - Number(withdrawAmount)));
      setWithdrawAmount("");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`flex items-start gap-2 p-3 rounded-xl text-sm ${
            message.type === "ok"
              ? "bg-green-500/10 border border-green-500/20 text-green-500"
              : "bg-accent/10 border border-accent/20 text-accent"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          {message.text}
        </div>
      )}

      {/* Saldo */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="metal-border rounded-2xl p-6">
          <p className="text-sm text-muted-foreground">Saldo disponible</p>
          <p className="text-3xl font-bold mt-1">{formatUsd(balanceAvailable)}</p>
          <p className="text-xs text-muted-foreground mt-1">
            En proceso: {formatUsd(balancePending)}
          </p>
        </div>
        <div className="metal-card rounded-2xl p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center">
            <Coins className="w-6 h-6 text-aff-cyan" />
          </div>
          <div>
            <p className="font-semibold">Pagos en cripto y Binance Pay</p>
            <p className="text-xs text-muted-foreground mt-1">
              USDT · USDC (6 redes) · BTC · Binance ID/email
              {isVenezuela ? " · Pago Móvil (Bs) 🇻🇪" : ""} · Retiro mínimo {formatUsd(MIN_WITHDRAWAL)}
            </p>
          </div>
        </div>
      </div>

      {/* KYC warning */}
      {!kycApproved && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Para retirar necesitas verificar tu identidad.{" "}
            <Link href="/afiliados/panel/documentos" className="underline font-medium">
              Sube tu documento aquí
            </Link>
            .
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Solicitar retiro */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Solicitar retiro</h2>
          {methods.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Agrega primero un método de pago en la sección de al lado.
            </p>
          ) : !kycApproved ? (
            <p className="text-sm text-muted-foreground">
              Verifica tu identidad en Documentos para habilitar los retiros.
            </p>
          ) : (
            <form onSubmit={requestWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Método de pago</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  required
                  className={inputClass}
                >
                  <option value="" disabled>Selecciona un método</option>
                  {methods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.type === "BINANCE_PAY"
                        ? `Binance Pay — ${m.binanceId || m.binanceEmail}`
                        : m.type === "PAGO_MOVIL"
                          ? `Pago Móvil — ${m.pagoMovilPhone} (${m.pagoMovilBank})`
                          : `${m.currency} (${NETWORK_LABELS[m.network ?? ""] ?? m.network}) — ${m.address?.slice(0, 12)}…`}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Monto (mínimo {formatUsd(MIN_WITHDRAWAL)})
                </label>
                <input
                  type="number"
                  min={MIN_WITHDRAWAL}
                  max={Math.floor(balanceAvailable * 100) / 100}
                  step="0.01"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  required
                  placeholder={`Ej: ${MIN_WITHDRAWAL}`}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-aff metal-shine w-full px-6 py-3 text-sm disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Solicitar retiro"}
              </button>
            </form>
          )}

          {/* Historial */}
          <div className="mt-8">
            <h3 className="font-bold text-sm mb-3">Historial de retiros</h3>
            {withdrawals.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no has solicitado retiros.</p>
            ) : (
              <ul className="space-y-2">
                {withdrawals.map((w) => (
                  <li key={w.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0">
                    <div>
                      <p className="font-semibold">{formatUsd(w.netAmount)}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(w.createdAt).toLocaleDateString("es-ES")} ·{" "}
                        {w.payoutMethod.type === "BINANCE_PAY"
                          ? "Binance Pay"
                          : w.payoutMethod.type === "PAGO_MOVIL"
                            ? "Pago Móvil (bolívares)"
                            : `${w.payoutMethod.currency} ${w.payoutMethod.network}`}
                        {w.txHash && ` · ${w.txHash.slice(0, 18)}…`}
                      </p>
                      {w.notes && <p className="text-xs text-muted-foreground">{w.notes}</p>}
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${STATUS_COLORS[w.status] ?? ""}`}>
                      {getWithdrawalStatusLabel(w.status)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Métodos de pago */}
        <div className="metal-card rounded-2xl p-6">
          <h2 className="font-bold mb-4">Métodos de pago</h2>

          <ul className="space-y-2 mb-6">
            {methods.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 text-sm p-3 rounded-xl bg-surface-hover border border-border">
                <div className="flex items-center gap-3 min-w-0">
                  <Wallet className="w-4 h-4 text-aff-cyan shrink-0" />
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {m.label || "Método"} {m.isDefault && <span className="text-[10px] text-aff-cyan">· Predeterminado</span>}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {m.type === "BINANCE_PAY"
                        ? `Binance Pay (${m.binanceId ? `ID ${m.binanceId}` : m.binanceEmail})`
                        : m.type === "PAGO_MOVIL"
                          ? `Pago Móvil · ${m.pagoMovilPhone} · ${m.pagoMovilBank}`
                          : `${m.currency} · ${NETWORK_LABELS[m.network ?? ""] ?? m.network} · ${m.address}`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeMethod(m.id)}
                  className="p-2 rounded-lg hover:bg-surface-hover text-muted-foreground hover:text-accent transition-colors shrink-0"
                  aria-label="Eliminar método"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>

          {/* Selector de tipo */}
          <div className={`grid gap-3 mb-5 ${isVenezuela ? "grid-cols-3" : "grid-cols-2"}`}>
            <button
              onClick={() => {
                setForm({ mode: "binance" });
                setNetwork("");
              }}
              className={`p-4 rounded-xl border text-sm font-medium transition-colors ${
                form.mode === "binance" ? "border-aff-cyan bg-aff-blue/10 text-aff-cyan" : "border-border hover:bg-surface-hover"
              }`}
            >
              <Coins className="w-5 h-5 mx-auto mb-2" />
              Binance Pay
            </button>
            <button
              onClick={() => setForm({ mode: "wallet" })}
              className={`p-4 rounded-xl border text-sm font-medium transition-colors ${
                form.mode === "wallet" ? "border-aff-cyan bg-aff-blue/10 text-aff-cyan" : "border-border hover:bg-surface-hover"
              }`}
            >
              <Wallet className="w-5 h-5 mx-auto mb-2" />
              Wallet cripto
            </button>
            {isVenezuela && (
              <button
                onClick={() => setForm({ mode: "pago-movil" })}
                className={`p-4 rounded-xl border text-sm font-medium transition-colors ${
                  form.mode === "pago-movil" ? "border-aff-cyan bg-aff-blue/10 text-aff-cyan" : "border-border hover:bg-surface-hover"
                }`}
              >
                <Smartphone className="w-5 h-5 mx-auto mb-2" />
                Pago Móvil 🇻🇪
              </button>
            )}
          </div>

          {form.mode === "pago-movil" && (
            <form onSubmit={addMethod} className="space-y-4">
              <p className="text-xs text-aff-cyan bg-aff-blue/5 border border-aff-blue/15 rounded-xl p-3">
                📲 Cobra tus comisiones en bolívares directamente a tu cuenta bancaria
                venezolana. Exclusivo para afiliados en Venezuela.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1.5">Teléfono Pago Móvil</label>
                <input
                  value={pmPhone}
                  onChange={(e) => setPmPhone(e.target.value)}
                  required
                  placeholder="0412-1234567"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Banco</label>
                <input
                  value={pmBank}
                  onChange={(e) => setPmBank(e.target.value)}
                  required
                  placeholder="Banco de Venezuela (0102)"
                  className={inputClass}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Titular</label>
                  <input
                    value={pmHolder}
                    onChange={(e) => setPmHolder(e.target.value)}
                    required
                    placeholder="Tu nombre"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Cédula</label>
                  <input
                    value={pmId}
                    onChange={(e) => setPmId(e.target.value)}
                    required
                    placeholder="V-12345678"
                    className={inputClass}
                  />
                </div>
              </div>
              <button type="submit" disabled={busy} className="btn-aff metal-shine w-full px-6 py-3 text-sm disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar Pago Móvil"}
              </button>
            </form>
          )}

          {form.mode === "binance" && (
            <form onSubmit={addMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Tipo de cuenta</label>
                <select
                  value={binanceType}
                  onChange={(e) => setBinanceType(e.target.value as "BINANCE_ID" | "BINANCE_EMAIL")}
                  className={inputClass}
                >
                  <option value="BINANCE_ID">Binance ID (numérico)</option>
                  <option value="BINANCE_EMAIL">Email de Binance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  {binanceType === "BINANCE_ID" ? "Tu Binance ID" : "Email de tu cuenta Binance"}
                </label>
                <input
                  value={binanceField}
                  onChange={(e) => setBinanceField(e.target.value)}
                  required
                  placeholder={binanceType === "BINANCE_ID" ? "Ej: 123456789" : "tu@email.com"}
                  className={inputClass}
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Encuentra tu Binance ID en tu perfil de la app de Binance. El email debe ser
                  el de tu cuenta Binance (pago en USDT).
                </p>
              </div>
              <button type="submit" disabled={busy} className="btn-aff metal-shine w-full px-6 py-3 text-sm disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar Binance Pay"}
              </button>
            </form>
          )}

          {form.mode === "wallet" && (
            <form onSubmit={addMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => {
                    setCurrency(e.target.value);
                    setNetwork("");
                  }}
                  className={inputClass}
                >
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Red</label>
                <select value={network} onChange={(e) => setNetwork(e.target.value)} required className={inputClass}>
                  <option value="" disabled>Selecciona la red</option>
                  {SUPPORTED_CURRENCIES.find((c) => c.code === currency)?.networks.map((n) => (
                    <option key={n} value={n}>
                      {NETWORK_LABELS[n]}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-accent/80 mt-1.5">
                  ⚠️ Verifica que la red sea la correcta: enviar a una dirección de otra red
                  implica pérdida de fondos.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Dirección de wallet</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder={currency === "BTC" ? "bc1q…" : network === "TRC20" ? "T…" : "0x…"}
                  className={inputClass}
                />
              </div>
              <button type="submit" disabled={busy} className="btn-aff metal-shine w-full px-6 py-3 text-sm disabled:opacity-60">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Agregar wallet"}
              </button>
            </form>
          )}

          {form.mode !== "closed" && (
            <button
              onClick={() => setForm({ mode: "closed" })}
              className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
