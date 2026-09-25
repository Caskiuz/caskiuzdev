"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Upload, FileText, ShieldCheck, FileCheck2, FileSignature } from "lucide-react";

interface DocumentItem {
  id: number;
  type: string;
  fileName: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const DOC_TYPES = [
  {
    key: "ID",
    title: "Identificación (KYC)",
    text: "Cédula, pasaporte o DNI. Obligatorio para poder retirar comisiones.",
    icon: ShieldCheck,
  },
  {
    key: "TAX_FORM",
    title: "Formulario fiscal",
    text: "W-8BEN, W-9 o documento fiscal equivalente de tu país (opcional según tu jurisdicción).",
    icon: FileCheck2,
  },
  {
    key: "CONTRACT",
    title: "Contrato firmado",
    text: "Contrato de afiliado firmado (opcional; se puede solicitar en cualquier momento).",
    icon: FileSignature,
  },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export function DocumentsClient({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [activeType, setActiveType] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !activeType) return;

    if (file.size > 2 * 1024 * 1024) {
      flash("error", "El archivo supera el límite de 2MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      setBusy(true);
      try {
        const res = await fetch("/api/affiliate/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: activeType,
            fileName: file.name,
            fileData: reader.result,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          flash("error", json.error || "No se pudo subir el documento.");
          return;
        }
        flash("ok", "Documento subido. Lo revisaremos en un máximo de 72 horas.");
        setDocuments((prev) => [{ ...json.document, notes: null, reviewedAt: null }, ...prev]);
        setActiveType(null);
      } catch {
        flash("error", "Error de conexión.");
      } finally {
        setBusy(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  const kycApproved = documents.some((d) => d.type === "ID" && d.status === "APPROVED");

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

      {kycApproved ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-500">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          Identidad verificada. Tus retiros están habilitados. 🎉
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          Sube tu documento de identidad para habilitar los retiros.
        </div>
      )}

      {/* Tipos de documento */}
      <div className="grid sm:grid-cols-3 gap-4">
        {DOC_TYPES.map((doc) => {
          const existing = documents.find((d) => d.type === doc.key);
          const isOpen = activeType === doc.key;
          return (
            <div
              key={doc.key}
              className={`metal-card rounded-2xl p-5 ${isOpen ? "ring-2 ring-aff-cyan" : ""}`}
            >
              <doc.icon className="w-6 h-6 text-aff-cyan mb-3" />
              <h3 className="font-bold text-sm">{doc.title}</h3>
              <p className="text-xs text-muted-foreground mt-1.5 mb-4 leading-relaxed">{doc.text}</p>

              {existing ? (
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      existing.status === "APPROVED"
                        ? "bg-green-500/10 text-green-500"
                        : existing.status === "REJECTED"
                          ? "bg-accent/10 text-accent"
                          : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {STATUS_LABELS[existing.status] ?? existing.status}
                  </span>
                  {existing.status === "REJECTED" && (
                    <button
                      onClick={() => {
                        setActiveType(doc.key);
                        fileInputRef.current?.click();
                      }}
                      className="text-xs text-aff-cyan hover:underline"
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setActiveType(doc.key);
                    fileInputRef.current?.click();
                  }}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors disabled:opacity-60"
                >
                  <Upload className="w-3.5 h-3.5" /> Subir archivo
                </button>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFile}
        className="hidden"
      />

      {/* Historial */}
      <div className="metal-card rounded-2xl p-6">
        <h2 className="font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-aff-cyan" /> Historial de documentos
        </h2>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aún no has subido documentos.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 text-sm py-2 border-b border-border last:border-0">
                <div>
                  <p className="font-medium">
                    {DOC_TYPES.find((t) => t.key === d.type)?.title ?? d.type} · {d.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Subido el {new Date(d.createdAt).toLocaleDateString("es-ES")}
                    {d.notes && <> · Nota: {d.notes}</>}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                    d.status === "APPROVED"
                      ? "bg-green-500/10 text-green-500"
                      : d.status === "REJECTED"
                        ? "bg-accent/10 text-accent"
                        : "bg-yellow-500/10 text-yellow-500"
                  }`}
                >
                  {STATUS_LABELS[d.status] ?? d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          Tus documentos se almacenan cifrados en nuestra base de datos y solo el equipo de
          Caskiuz puede revisarlos, exclusivamente para verificación y cumplimiento.
        </p>
      </div>
    </div>
  );
}
