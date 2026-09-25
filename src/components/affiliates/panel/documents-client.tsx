"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Upload, FileText, ShieldCheck } from "lucide-react";

interface DocumentItem {
  id: number;
  type: string;
  fileName: string | null;
  status: string;
  notes: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};

export function DocumentsClient({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

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
            type: "ID",
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
      } catch {
        flash("error", "Error de conexión.");
      } finally {
        setBusy(false);
        e.target.value = "";
      }
    };
    reader.readAsDataURL(file);
  }

  const latest = documents[0] ?? null;
  const kycApproved = documents.some((d) => d.status === "APPROVED");
  const pending = latest?.status === "PENDING";

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

      {/* Estado */}
      {kycApproved ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-500">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          Identidad verificada. Tus retiros están habilitados. 🎉
        </div>
      ) : pending ? (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-aff-blue/10 border border-aff-blue/20 text-sm text-aff-cyan">
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          Tu documento está en revisión. Te notificaremos por email cuando sea aprobado (máximo 72 horas).
        </div>
      ) : (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-sm text-yellow-600 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          Sube tu documento de identidad para habilitar los retiros.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 items-start">
        {/* Verificación de identidad */}
        <div className="metal-card rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-aff-cyan" />
            </div>
            <div>
              <h2 className="font-bold">Verificación de identidad (KYC)</h2>
              <p className="text-xs text-muted-foreground">
                Único requisito documental para cobrar tus comisiones
              </p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed mb-5">
            Sube una foto clara de tu cédula, pasaporte o DNI (ambas caras en un solo
            archivo si es posible). Se usa exclusivamente para verificación y cumplimiento
            normativo, y solo el equipo de Caskiuz puede revisarla.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="btn-aff metal-shine px-5 py-2.5 text-sm disabled:opacity-60"
            >
              <Upload className="w-4 h-4" /> {documents.length > 0 ? "Subir nuevo documento" : "Subir documento"}
            </button>
            {latest && (
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  latest.status === "APPROVED"
                    ? "bg-green-500/10 text-green-500"
                    : latest.status === "REJECTED"
                      ? "bg-accent/10 text-accent"
                      : "bg-yellow-500/10 text-yellow-500"
                }`}
              >
                {STATUS_LABELS[latest.status] ?? latest.status}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-3">JPG, PNG o PDF · máximo 2MB</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFile}
            className="hidden"
          />
        </div>

        {/* Contrato y términos */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-bold mb-3">Contrato y términos</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            El contrato del programa de afiliados se celebra al momento del registro: al crear
            tu cuenta aceptaste los{" "}
            <a href="/afiliados/terminos" target="_blank" className="text-aff-cyan hover:underline">
              Términos y Condiciones
            </a>{" "}
            del programa, que rigen la relación comercial entre tú y Caskiuz (comisiones,
            niveles, pagos, retenciones y prácticas prohibidas).
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mt-3">
            No necesitas firmar ni subir ningún documento adicional. Si en el futuro se
            requiriera información fiscal según tu jurisdicción, el equipo de Caskiuz te lo
            solicitará por email.
          </p>
        </div>
      </div>

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
                  <p className="font-medium">Identificación · {d.fileName}</p>
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
      </div>
    </div>
  );
}
