"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle, Eye, X } from "lucide-react";

interface DocItem {
  id: number;
  type: string;
  fileName: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  ID: "Identificación (KYC)",
  TAX_FORM: "Formulario fiscal",
  CONTRACT: "Contrato",
};

export function DocumentReview({ documents }: { documents: DocItem[] }) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [viewing, setViewing] = useState<string | null>(null); // data URL
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [items, setItems] = useState(documents);

  async function review(id: number, status: "APPROVED" | "REJECTED") {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, notes: notes[id] || undefined }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: json.error || "No se pudo revisar el documento." });
        return;
      }
      setItems((prev) =>
        prev.map((d) => (d.id === id ? { ...d, status, notes: notes[id] || null } : d))
      );
      setMessage({ type: "ok", text: status === "APPROVED" ? "Documento aprobado ✅" : "Documento rechazado" });
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setBusyId(null);
      setTimeout(() => setMessage(null), 4000);
    }
  }

  async function view(id: number) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/documents/${id}`);
      const json = await res.json();
      if (json.fileData) setViewing(json.fileData);
      else setMessage({ type: "error", text: "No se pudo cargar el archivo." });
    } catch {
      setMessage({ type: "error", text: "Error de conexión." });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className={`text-xs flex items-center gap-1.5 ${message.type === "ok" ? "text-green-500" : "text-accent"}`}>
          {message.type === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
          {message.text}
        </p>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Este afiliado no ha subido documentos.</p>
      ) : (
        items.map((doc) => (
          <div key={doc.id} className="p-4 rounded-xl border border-border bg-surface-hover/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">
                  {TYPE_LABELS[doc.type] ?? doc.type} · {doc.fileName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Subido el {new Date(doc.createdAt).toLocaleDateString("es-ES")}
                  {doc.notes && <> · Nota: {doc.notes}</>}
                </p>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  doc.status === "APPROVED"
                    ? "bg-green-500/10 text-green-500"
                    : doc.status === "REJECTED"
                      ? "bg-accent/10 text-accent"
                      : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {doc.status === "APPROVED" ? "Aprobado" : doc.status === "REJECTED" ? "Rechazado" : "Pendiente"}
              </span>
            </div>

            {doc.status === "PENDING" && (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => view(doc.id)}
                    disabled={busyId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-60"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver archivo
                  </button>
                  <button
                    onClick={() => review(doc.id, "APPROVED")}
                    disabled={busyId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 disabled:opacity-60"
                  >
                    {busyId === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    Aprobar
                  </button>
                  <button
                    onClick={() => review(doc.id, "REJECTED")}
                    disabled={busyId === doc.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20 disabled:opacity-60"
                  >
                    <X className="w-3.5 h-3.5" /> Rechazar
                  </button>
                </div>
                <input
                  value={notes[doc.id] ?? ""}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [doc.id]: e.target.value }))}
                  placeholder="Nota para el afiliado (opcional, ej: 'la imagen está borrosa')"
                  className="w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm"
                />
              </>
            )}
          </div>
        ))
      )}

      {/* Visor del documento */}
      {viewing && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setViewing(null)}
        >
          <div className="max-w-3xl w-full max-h-[85vh] bg-surface rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <p className="text-sm font-medium">Documento</p>
              <button onClick={() => setViewing(null)} className="p-1.5 rounded-lg hover:bg-surface-hover">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[75vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={viewing} alt="Documento del afiliado" className="w-full rounded-xl" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
