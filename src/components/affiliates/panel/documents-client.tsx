"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, Upload, FileText, ShieldCheck, Eye, Loader2 } from "lucide-react";
import { DocumentViewer } from "./document-viewer";

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

// El archivo viaja como base64 (+33% de tamaño) dentro de un JSON y Vercel
// limita cada petición a 4.5 MB. Por eso: las fotos se optimizan en el
// navegador antes de subirlas y los PDF tienen un tope de 3 MB.
const MAX_PDF_BYTES = 3 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 4_000_000;
const IMAGE_MAX_SIDE = 2000;
const IMAGE_QUALITY = 0.85;

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Formato de imagen no soportado."));
    img.src = dataUrl;
  });
}

function drawToJpeg(img: HTMLImageElement, maxSide: number, quality: number): string {
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin soporte de canvas.");
  // Fondo blanco para que las zonas transparentes de un PNG no salgan negras
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Reduce la foto (tamaño y calidad) hasta que quepa bajo el límite de subida. */
async function optimizeImage(file: File): Promise<string> {
  const original = await readAsDataURL(file);
  const img = await loadImage(original);
  const attempts: Array<[number, number]> = [
    [IMAGE_MAX_SIDE, IMAGE_QUALITY],
    [1600, 0.78],
    [1280, 0.7],
  ];
  let result = "";
  for (const [maxSide, quality] of attempts) {
    result = drawToJpeg(img, maxSide, quality);
    if (result.length <= MAX_DATA_URL_LENGTH) break;
  }
  return result;
}

export function DocumentsClient({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [viewing, setViewing] = useState<{ fileName: string | null; fileData: string } | null>(null);
  const [viewBusyId, setViewBusyId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  async function view(id: number) {
    setViewBusyId(id);
    try {
      const res = await fetch(`/api/affiliate/documents/${id}`);
      const json = await res.json();
      if (!res.ok || !json.fileData) {
        flash("error", json.error || "No se pudo cargar el documento.");
        return;
      }
      setViewing({ fileName: json.fileName ?? null, fileData: json.fileData });
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setViewBusyId(null);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setBusy(true);
    try {
      const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
      const isImage =
        file.type.startsWith("image/") || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);

      let fileData: string;
      let uploadName = file.name;
      let optimized = false;

      try {
        if (isPdf) {
          if (file.size > MAX_PDF_BYTES) {
            flash("error", "El PDF supera 3 MB. Envíalo como foto (se optimiza sola) o comprímelo.");
            return;
          }
          fileData = await readAsDataURL(file);
        } else if (isImage) {
          fileData = await optimizeImage(file);
          if (fileData.length > MAX_DATA_URL_LENGTH) {
            flash(
              "error",
              "La imagen es demasiado grande incluso optimizada. Prueba con otra foto o un PDF."
            );
            return;
          }
          optimized = file.size > 1_500_000;
          uploadName = file.name.replace(/\.[^.]+$/, "") + ".jpg";
        } else {
          flash("error", "Formato no permitido. Sube una foto (JPG, PNG, HEIC) o un PDF.");
          return;
        }
      } catch {
        flash("error", "No se pudo procesar el archivo. Prueba con una foto JPG/PNG o un PDF.");
        return;
      }

      try {
        const res = await fetch("/api/affiliate/documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: "ID", fileName: uploadName, fileData }),
        });
        const json = await res.json();
        if (!res.ok) {
          flash("error", json.error || "No se pudo subir el documento.");
          return;
        }
        flash(
          "ok",
          optimized
            ? "Documento subido (tu foto se optimizó automáticamente). Lo revisaremos en un máximo de 72 horas."
            : "Documento subido. Lo revisaremos en un máximo de 72 horas."
        );
        setDocuments((prev) => [{ ...json.document, notes: null, reviewedAt: null }, ...prev]);
        setViewing({ fileName: uploadName, fileData });
      } catch {
        flash("error", "Error de conexión.");
      }
    } finally {
      setBusy(false);
      input.value = "";
    }
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
              <Upload className="w-4 h-4" />{" "}
              {busy
                ? "Procesando…"
                : documents.length > 0
                  ? "Subir nuevo documento"
                  : "Subir documento"}
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
          <p className="text-xs text-muted-foreground mt-3">
            JPG, PNG o PDF · las fotos se optimizan automáticamente · PDF hasta 3 MB
          </p>

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
            niveles, pagos, reembolsos y prácticas prohibidas).
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
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => view(d.id)}
                    disabled={viewBusyId === d.id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-border hover:bg-surface-hover disabled:opacity-60"
                    title="Ver archivo"
                  >
                    {viewBusyId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
                    Ver
                  </button>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      d.status === "APPROVED"
                        ? "bg-green-500/10 text-green-500"
                        : d.status === "REJECTED"
                          ? "bg-accent/10 text-accent"
                          : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {viewing && (
        <DocumentViewer
          fileName={viewing.fileName}
          fileData={viewing.fileData}
          onClose={() => setViewing(null)}
        />
      )}
    </div>
  );
}
