"use client";

import { useState } from "react";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  Search,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { getTierInfo } from "@/lib/affiliate";

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
  referralCode: string;
  slug: string | null;
  tier: string;
}

interface SaleRow {
  id: number;
  affiliateId: number;
  serviceTitle: string;
  amount: number;
  status: string;
  source: string;
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

const SOURCE_LABELS: Record<string, string> = {
  FORM: "Formulario",
  WHATSAPP: "WhatsApp",
  MANUAL: "Manual",
};

const SOURCE_COLORS: Record<string, string> = {
  FORM: "bg-aff-blue/10 text-aff-cyan",
  WHATSAPP: "bg-green-500/10 text-green-500",
  MANUAL: "bg-surface-hover text-muted-foreground",
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

/**
 * Extrae el código de un mensaje de WhatsApp pegado completo
 * ("…\n\nCódigo de referido: X") o devuelve el texto tal cual.
 */
function parseAffiliateQuery(raw: string): string {
  const match = raw.match(/C[oó]digo de referido:\s*([A-Za-z0-9._-]+)/i);
  if (match) return match[1];
  return raw.trim();
}

function affiliateLabel(a: AffiliateOption): string {
  const tier = getTierInfo(a.tier);
  return `${tier.emoji} ${tier.name} · ${Math.round(tier.rate * 100)}%`;
}

/**
 * Buscador/resolutor de afiliados: pega el código o el mensaje completo de
 * WhatsApp y resuelve el afiliado solo; o busca por nombre, email o código.
 */
function AffiliatePicker({
  affiliates,
  selected,
  onSelect,
  hint,
}: {
  affiliates: AffiliateOption[];
  selected: AffiliateOption | null;
  onSelect: (a: AffiliateOption | null, rawQuery: string) => void;
  hint?: string;
}) {
  const [query, setQuery] = useState("");

  const codeQuery = parseAffiliateQuery(query);
  const resolved = codeQuery
    ? affiliates.find(
        (a) =>
          a.referralCode.toUpperCase() === codeQuery.toUpperCase() ||
          (a.slug ?? "").toLowerCase() === codeQuery.toLowerCase()
      )
    : undefined;
  const suggestions =
    query.trim() && !resolved
      ? affiliates
          .filter((a) => {
            const q = query.trim().toLowerCase();
            return (
              a.name.toLowerCase().includes(q) ||
              a.email.toLowerCase().includes(q) ||
              a.referralCode.toLowerCase().includes(q) ||
              (a.slug ?? "").includes(q)
            );
          })
          .slice(0, 6)
      : [];

  function handleChange(value: string) {
    setQuery(value);
    const code = parseAffiliateQuery(value);
    const found = code
      ? affiliates.find(
          (a) =>
            a.referralCode.toUpperCase() === code.toUpperCase() ||
            (a.slug ?? "").toLowerCase() === code.toLowerCase()
        )
      : undefined;
    onSelect(found ?? null, value);
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">
        Código de referido o mensaje de WhatsApp
      </label>
      <textarea
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        rows={2}
        placeholder={'Pega el mensaje completo (detecta "Código de referido: X") o busca por nombre, email o código…'}
        className={inputClass}
      />
      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
        <Search className="w-3.5 h-3.5" />
        Funciona con el mensaje entero pegado: el sistema extrae el código solo.
      </p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}

      {selected && (
        <div className="mt-2 flex items-center gap-2 text-sm rounded-lg border border-green-500/30 bg-green-500/5 px-3 py-2">
          <UserCheck className="w-4 h-4 text-green-500 shrink-0" />
          <span className="font-medium">{selected.name}</span>
          <span className="text-xs text-muted-foreground">
            {selected.slug || selected.referralCode} · {affiliateLabel(selected)}
          </span>
        </div>
      )}

      {suggestions.length > 0 && (
        <ul className="mt-2 rounded-lg border border-border divide-y divide-border overflow-hidden">
          {suggestions.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => {
                  setQuery(a.slug || a.referralCode);
                  onSelect(a, a.slug || a.referralCode);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-surface-hover"
              >
                <span className="font-medium">{a.name}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  {a.slug || a.referralCode} · {a.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {query.trim() && !resolved && suggestions.length === 0 && (
        <p className="text-xs text-accent mt-1.5">Sin coincidencias. Revisa el código o busca por nombre.</p>
      )}
    </div>
  );
}

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
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  // Formulario de venta
  const [mode, setMode] = useState<"contact" | "manual">("contact");
  const [contactId, setContactId] = useState("");
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateOption | null>(null);
  const [affiliateRawQuery, setAffiliateRawQuery] = useState("");
  const [channel, setChannel] = useState<"WHATSAPP" | "MANUAL">("WHATSAPP");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [serviceTitle, setServiceTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("LEAD");

  // Formulario de lead
  const [leadAffiliate, setLeadAffiliate] = useState<AffiliateOption | null>(null);
  const [leadRawQuery, setLeadRawQuery] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadService, setLeadService] = useState("");
  const [leadNote, setLeadNote] = useState("");

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  const selectedContact = contacts.find((c) => c.id === Number(contactId));
  const contactAffiliate = selectedContact?.affiliateId
    ? affiliates.find((a) => a.id === selectedContact.affiliateId)
    : undefined;

  async function createSale(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const affId =
      mode === "contact" ? String(selectedContact?.affiliateId ?? "") : String(selectedAffiliate?.id ?? "");
    try {
      const res = await fetch("/api/admin/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: Number(affId) || undefined,
          affiliateCode:
            mode === "manual" && !selectedAffiliate ? parseAffiliateQuery(affiliateRawQuery) : undefined,
          contactId: mode === "contact" ? Number(contactId) : null,
          clientName: mode === "manual" ? clientName : undefined,
          clientEmail: mode === "manual" ? clientEmail : undefined,
          source: mode === "contact" ? "FORM" : channel,
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
      setSelectedAffiliate(null);
      setAffiliateRawQuery("");
      setClientName("");
      setClientEmail("");
      window.location.reload();
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusy(false);
    }
  }

  async function createLead(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          affiliateId: leadAffiliate?.id,
          affiliateCode: !leadAffiliate ? parseAffiliateQuery(leadRawQuery) : undefined,
          name: leadName,
          email: leadEmail,
          service: leadService,
          message: leadNote,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        flash("error", json.error || "No se pudo registrar el lead.");
        return;
      }
      flash("ok", "Lead registrado. Ya aparece en «Mis leads» del afiliado.");
      setShowLeadForm(false);
      setLeadName("");
      setLeadEmail("");
      setLeadService("");
      setLeadNote("");
      setLeadAffiliate(null);
      setLeadRawQuery("");
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

  return (
    <div className="space-y-6">
      {message && (
        <p className={`text-sm flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => {
            setShowLeadForm(!showLeadForm);
            setShowForm(false);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-hover"
        >
          {showLeadForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {showLeadForm ? "Cerrar" : "Registrar lead"}
        </button>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setShowLeadForm(false);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nueva venta"}
        </button>
      </div>

      {showLeadForm && (
        <form onSubmit={createLead} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div>
            <h3 className="font-bold">Registrar lead</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Para conversaciones de WhatsApp u otro canal: pega el código y los datos del cliente y el lead
              aparece al instante en «Mis leads» del afiliado, sin crear una venta todavía.
            </p>
          </div>

          <AffiliatePicker
            affiliates={affiliates}
            selected={leadAffiliate}
            onSelect={(a, raw) => {
              setLeadAffiliate(a);
              setLeadRawQuery(raw);
            }}
          />

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Nombre del cliente</label>
              <input
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                required
                placeholder="Ej: María Pérez"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Email del cliente (opcional)</label>
              <input
                type="email"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                placeholder="cliente@email.com"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Servicio de interés (opcional)</label>
            <input
              value={leadService}
              onChange={(e) => setLeadService(e.target.value)}
              placeholder="Ej: E-commerce"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Nota (opcional)</label>
            <input
              value={leadNote}
              onChange={(e) => setLeadNote(e.target.value)}
              placeholder="Ej: preguntó por una tienda online, presupuesto pendiente"
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Registrar lead
          </button>
        </form>
      )}

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
              <p className="font-semibold">Manual (WhatsApp u otro canal)</p>
              <p className="text-xs text-muted-foreground mt-0.5">Pega el código del afiliado y listo</p>
            </button>
          </div>

          {mode === "contact" ? (
            <div>
              <label className="block text-sm font-medium mb-1.5">Lead (contacto)</label>
              {contacts.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-surface-hover border border-border rounded-lg p-3">
                  Aún no hay leads. Un lead se crea cuando alguien entra por el link de un afiliado y llena el
                  formulario de contacto, o cuando lo registras con el botón «Registrar lead».
                </p>
              ) : (
                <>
                  <select value={contactId} onChange={(e) => setContactId(e.target.value)} required className={inputClass}>
                    <option value="">Selecciona un lead</option>
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email}) — {c.service || "sin servicio"}
                        {c.affiliateId
                          ? ` · ${affiliates.find((a) => a.id === c.affiliateId)?.name ?? `Afiliado #${c.affiliateId}`}`
                          : ""}
                      </option>
                    ))}
                  </select>
                  {selectedContact && !selectedContact.affiliateId && (
                    <p className="text-xs text-accent mt-1.5">
                      ⚠️ Este lead no tiene afiliado atribuido. Usa el modo manual para asignarlo.
                    </p>
                  )}
                  {contactAffiliate && (
                    <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      Se atribuirá a {contactAffiliate.name} · {affiliateLabel(contactAffiliate)}
                    </p>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <AffiliatePicker
                affiliates={affiliates}
                selected={selectedAffiliate}
                onSelect={(a, raw) => {
                  setSelectedAffiliate(a);
                  setAffiliateRawQuery(raw);
                }}
              />

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Nombre del cliente (opcional)</label>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ej: María Pérez"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Email del cliente (opcional)</label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                Si pones los datos del cliente se crea también el lead atribuido al afiliado (visible en «Mis leads»).
              </p>

              <div>
                <label className="block text-sm font-medium mb-1.5">Canal de la venta</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setChannel("WHATSAPP")}
                    className={`p-2.5 rounded-xl border text-sm ${
                      channel === "WHATSAPP" ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel("MANUAL")}
                    className={`p-2.5 rounded-xl border text-sm ${
                      channel === "MANUAL" ? "border-primary bg-primary/5" : "border-border hover:bg-surface-hover"
                    }`}
                  >
                    Otro canal
                  </button>
                </div>
              </div>
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
            completo = 100%. Queda disponible de inmediato para que el afiliado la retire.
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
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground uppercase">
                <th className="px-5 py-3">Servicio</th>
                <th className="px-5 py-3">Afiliado</th>
                <th className="px-5 py-3">Origen</th>
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
                  <td className="px-5 py-3">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${
                        SOURCE_COLORS[sale.source] ?? SOURCE_COLORS.MANUAL
                      }`}
                    >
                      {SOURCE_LABELS[sale.source] ?? sale.source}
                    </span>
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
                  <td colSpan={7} className="px-5 py-10 text-center text-muted-foreground">
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
