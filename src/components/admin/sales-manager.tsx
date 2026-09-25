"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Plus, X } from "lucide-react";

interface ContactOption {
  id: number;
  name: string;
  email: string;
  service: string | null;
  affiliateId: number | null;
}

interface AffiliateOption {
  id: number;
  name: string;
  email: string;
}

interface SaleRow {
  id: number;
  affiliateId: number;
  serviceTitle: string;
  amount: number;
  status: string;
  commissionTotal: number;
  createdAt: string;
  affiliate: { id: number; name: string; email: string };
  contact: { id: number; name: string; email: string } | null;
}

const STATUS_OPTIONS = [
  { value: "LEAD", label: "Lead" },
  { value: "DEPOSIT_PAID", label: "Anticipo pagado (50%)" },
  { value: "FULLY_PAID", label: "Pagado completo" },
  { value: "REFUNDED", label: "Reembolsado" },
];

const STATUS_COLORS: Record<string, string> = {
  LEAD: "bg-surface-hover text-muted-foreground",
  DEPOSIT_PAID: "bg-yellow-500/10 text-yellow-500",
  FULLY_PAID: "bg-green-500/10 text-green-500",
  REFUNDED: "bg-accent/10 text-accent",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function SalesManager({
  sales,
  contacts,
  affiliates,
}: {
  sales: SaleRow[];
  contacts: ContactOption[];
  affiliates: AffiliateOption[];
}) {
  const [items, setItems] = useState(sales);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Formulario
  const [mode, setMode] = useState<"contact" | "manual">("contact");
  const [contactId, setContactId] = useState("");
  const [affiliateId, setAffiliateId] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("LEAD");

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function createSale(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      let affId = affiliateId;
      if (mode === "contact") {
        const contact = contacts.find((c) => c.id === Number(contactId));
        affId = String(contact?.affiliateId ?? "");
      }
      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: Number(affId),
          contactId: mode === "contact" ? Number(contactId) : null,
          serviceTitle,
          amount: Number(amount),
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo crear la venta.");
        return;
      }
      flash("ok", "Venta creada. La comisión se calculó según el nivel del afiliado.");
      setShowForm(false);
      setServiceTitle("");
      setAmount("");
      window.location.reload();
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function updateStatus(saleId: number, newStatus: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/sales/${saleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo actualizar.");
        return;
      }
      setItems((prev) => prev.map((s) => (s.id === saleId ? { ...s, status: newStatus } : s)));
      flash("ok", "Estado actualizado. Comisión recalculada.");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  const selectedContact = contacts.find((c) => c.id === Number(contactId));

  return (
    <div className="space-y-6">
      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nueva venta"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createSale} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <h3 className="font-bold">Crear venta</h3>

          <div className="grid sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode("contact")}
              className={`p-3 rounded-xl border text-sm text-left ${
                mode === "contact" ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="font-semibold">Desde un lead existente</p>
              <p className="text-xs text-muted-foreground mt-0.5">Atribuye un contacto que ya llegó por un afiliado</p>
            </button>
            <button
              type="button"
              onClick={() => setMode("manual")}
              className={`p-3 rounded-xl border text-sm text-left ${
                mode === "manual" ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
              }`}
            >
              <p className="font-semibold">Manual (sin lead)</p>
              <p className="text-xs text-muted-foreground mt-0.5">El cliente contactó por otro canal (WhatsApp, teléfono…)</p>
            </button>
          </div>

          {mode === "contact" ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Lead (contacto)</label>
              <select value={contactId} onChange={(e) => setContactId(e.target.value)} required className={inputClass}>
                <option value="">Selecciona un lead</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.email}) — {c.service || "sin servicio"}
                    {c.affiliateId ? ` · Afiliado #${c.affiliateId}` : ""}
                  </option>
                ))}
              </select>
              {selectedContact && !selectedContact.affiliateId && (
                <p className="text-xs text-accent mt-1.5">
                  ⚠️ Este lead no tiene afiliado atribuido. Usa el modo manual para asignarlo.
                </p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium mb-1.5">Afiliado</label>
              <select value={affiliateId} onChange={(e) => setAffiliateId(e.target.value)} required className={inputClass}>
                <option value="">Selecciona un afiliado</option>
                {affiliates.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.email})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-sm font-medium mb-1.5">Servicio</label>
              <input
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                required
                placeholder="Ej: E-commerce"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Monto (USD)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="999"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Estado de cobro</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputClass}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            💡 La comisión se devenga solo sobre lo cobrado: anticipo = 50% del monto, pagado
            completo = 100%. Entra en retención de 30 días tras el cobro total.
          </p>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Crear venta
          </button>
        </form>
      )}

      {/* Lista */}
      <div className="rounded-2xl border border-border bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-5 py-3">Servicio</th>
                <th className="px-5 py-3">Afiliado</th>
                <th className="px-5 py-3">Monto</th>
                <th className="px-5 py-3">Comisión</th>
                <th className="px-5 py-3">Estado de cobro</th>
                <th className="px-5 py-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {items.map((sale) => (
                <tr key={sale.id} className="border-b border-border last:border-0 hover:bg-surface-hover/50">
                  <td className="px-5 py-3">
                    <p className="font-medium">{sale.serviceTitle}</p>
                    {sale.contact && (
                      <p className="text-xs text-muted-foreground">Lead: {sale.contact.name}</p>
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {sale.affiliate.name}
                    <span className="block text-xs">{sale.affiliate.email}</span>
                  </td>
                  <td className="px-5 py-3 font-medium">${sale.amount.toFixed(2)}</td>
                  <td className="px-5 py-3 text-aff-cyan font-medium">${sale.commissionTotal.toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <select
                      value={sale.status}
                      onChange={(e) => updateStatus(sale.id, e.target.value)}
                      className={`px-2.5 py-1.5 rounded-lg border border-border text-xs ${STATUS_COLORS[sale.status] ?? ""}`}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>{s.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleDateString("es-ES")}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                    Aún no hay ventas. Crea la primera con el botón de nueva venta.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
