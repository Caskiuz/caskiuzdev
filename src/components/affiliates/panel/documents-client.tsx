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
const IMAGE_QUALITY = 0.82;
const IMAGE_ATTEMPTS: Array<[number, number]> = [
  [1600, IMAGE_QUALITY],
  [1400, 0.75],
  [1200, 0.65],
  [1000, 0.55],
];

type UploadStage = { label: string; percent: number | null } | null;

/** Lee un archivo como data URL, informando el porcentaje leído. */
function readAsDataURL(file: File, onProgress?: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo."));
    reader.readAsDataURL(file);
  });
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Formato de imagen no soportado."));
    img.src = src;
  });
}

interface DecodedImage {
  width: number;
  height: number;
  drawable: CanvasImageSource;
  cleanup: () => void;
}

/**
 * Decodifica la foto con varias estrategias, en orden de eficiencia:
 * 1) createImageBitmap(file): decodifica directo desde el archivo, sin crear
 *    la cadena base64 gigante que hace fallar fotos de 20–50 MP en teléfonos
 *    con poca memoria. La memoria se libera con cleanup().
 * 2) objectURL + <img>: cubre formatos que solo el decodificador nativo
 *    entiende (p. ej. HEIC en Safari de iPhone).
 * 3) base64 + <img>: último recurso.
 */
async function decodeImage(file: File): Promise<DecodedImage> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);
      return {
        width: bitmap.width,
        height: bitmap.height,
        drawable: bitmap,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // formato no decodable por esta vía: probamos con <img>
    }
  }

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const img = await loadImageElement(objectUrl);
    const cleanup = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      drawable: img,
      cleanup,
    };
  } catch {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }

  const dataUrl = await readAsDataURL(file);
  const img = await loadImageElement(dataUrl);
  return {
    width: img.naturalWidth || img.width,
    height: img.naturalHeight || img.height,
    drawable: img,
    cleanup: () => {},
  };
}

function drawToJpeg(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  maxSide: number,
  quality: number
): string {
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(sourceWidth * scale));
  canvas.height = Math.max(1, Math.round(sourceHeight * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin soporte de canvas.");
  // Fondo blanco para que las zonas transparentes de un PNG no salgan negras
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

/** Reduce la foto (tamaño y calidad) hasta que quepa bajo el límite de subida. */
async function optimizeImage(file: File, onStage: (label: string) => void): Promise<string> {
  onStage("Optimizando foto…");
  const decoded = await decodeImage(file);
  try {
    let result = "";
    for (const [maxSide, quality] of IMAGE_ATTEMPTS) {
      result = drawToJpeg(decoded.drawable, decoded.width, decoded.height, maxSide, quality);
      if (result.length <= MAX_DATA_URL_LENGTH) break;
    }
    return result;
  } finally {
    decoded.cleanup();
  }
}

/** Sube el JSON con XMLHttpRequest para tener progreso real de subida (%). */
function uploadWithProgress(
  url: string,
  payload: unknown,
  onProgress: (percent: number) => void
): Promise<{ status: number; json: { error?: string; document?: DocumentItem } | null }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      let json: { error?: string; document?: DocumentItem } | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        json = null;
      }
      resolve({ status: xhr.status, json });
    };
    xhr.onerror = () => reject(new Error("Error de conexión."));
    xhr.ontimeout = () => reject(new Error("Tiempo de espera agotado."));
    try {
      xhr.send(JSON.stringify(payload));
    } catch {
      reject(new Error("No se pudo enviar el archivo."));
    }
  });
}

type FileKind = "pdf" | "image" | "other";

/** Clasifica lo que el teléfono haya producido: PDF, imagen (cualquier formato) u otro. */
function detectKind(file: File): FileKind {
  const name = file.name || "";
  if (file.type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (file.type.startsWith("image/")) return "image";
  if (/\.(jpe?g|png|webp|heic|heif|gif|bmp|avif|tiff?)$/i.test(name)) return "image";
  // Cámaras que no reportan tipo ni extensión: se intenta como imagen igualmente
  if (!file.type && !/\.[a-z0-9]{1,5}$/i.test(name)) return "image";
  return "other";
}

function isHeic(file: File): boolean {
  return /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name || "");
}

const HEIC_HELP =
  "Tu teléfono guardó la foto en formato HEIC y este navegador no puede leerla. " +
  "Solución rápida: abre la foto y haz una captura de pantalla; sube esa captura. " +
  "(En iPhone también puedes ir a Ajustes → Cámara → Formatos → «Más compatible»).";

export function DocumentsClient({ initialDocuments }: { initialDocuments: DocumentItem[] }) {
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<UploadStage>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [viewing, setViewing] = useState<{ fileName: string | null; fileData: string } | null>(null);
  const [viewBusyId, setViewBusyId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), type === "error" ? 9000 : 6000);
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
    if (!file || busy) return;

    setBusy(true);
    setMessage(null);

    try {
      const kind = detectKind(file);
      if (kind === "other") {
        flash("error", "Formato no permitido. Sube una foto (JPG, PNG, HEIC…) o un PDF.");
        return;
      }

      let fileData: string;
      let uploadName = file.name || "documento";
      let optimized = false;

      try {
        if (kind === "pdf") {
          if (file.size > MAX_PDF_BYTES) {
            flash("error", "El PDF pesa más de 3 MB. Envíalo como foto (se optimiza sola) o comprímelo.");
            return;
          }
          setStage({ label: "Leyendo PDF…", percent: 0 });
          fileData = await readAsDataURL(file, (percent) =>
            setStage({ label: "Leyendo PDF…", percent })
          );
        } else {
          setStage({ label: "Preparando foto…", percent: null });
          fileData = await optimizeImage(file, (label) => setStage({ label, percent: null }));
          if (fileData.length > MAX_DATA_URL_LENGTH) {
            flash(
              "error",
              "La imagen es demasiado grande incluso optimizada. Intenta con una captura de pantalla de la foto o un PDF."
            );
            return;
          }
          optimized = file.size > 1_500_000;
          uploadName = uploadName.replace(/\.[^.]+$/, "") + ".jpg";
        }
      } catch {
        flash("error", isHeic(file) ? HEIC_HELP : "No se pudo procesar el archivo. Prueba con otra foto o un PDF.");
        return;
      }

      setStage({ label: "Subiendo…", percent: 0 });
      const { status, json } = await uploadWithProgress(
        "/api/affiliate/documents",
        { type: "ID", fileName: uploadName, fileData },
        (percent) => {
          // Al terminar la subida, el servidor aún verifica el documento
          if (percent >= 100) setStage({ label: "Verificando documento…", percent: null });
          else setStage({ label: "Subiendo…", percent });
        }
      );

      if (status < 200 || status >= 300) {
        flash("error", json?.error || "No se pudo subir el documento.");
        return;
      }

      flash(
        "ok",
        optimized
          ? "Documento subido ✅ (tu foto se optimizó automáticamente). Quedó en revisión; te avisaremos con una notificación en tu panel."
          : "Documento subido ✅. Quedó en revisión; te avisaremos con una notificación en tu panel."
      );
      setDocuments((prev) => [
        {
          id: json?.document?.id ?? Date.now(),
          type: json?.document?.type ?? "ID",
          fileName: json?.document?.fileName ?? uploadName,
          status: json?.document?.status ?? "PENDING",
          notes: null,
          createdAt: json?.document?.createdAt ?? new Date().toISOString(),
          reviewedAt: null,
        },
        ...prev,
      ]);
      setViewing({ fileName: uploadName, fileData });
    } catch {
      flash("error", "Error de conexión. Revisa tu internet e inténtalo de nuevo.");
    } finally {
      setBusy(false);
      setStage(null);
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
          Tu documento está en revisión. Te avisaremos con una notificación en tu panel
          cuando sea revisado (máximo 72 horas).
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
                ? "Subiendo…"
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

          {/* Progreso visible de la subida: etapas + porcentaje real */}
          {stage && (
            <div className="mt-4 space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-aff-cyan" />
                  {stage.label}
                  {stage.percent !== null ? ` ${stage.percent}%` : ""}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-surface-hover border border-border overflow-hidden">
                {stage.percent === null ? (
                  <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-aff-blue-deep to-aff-sky animate-pulse" />
                ) : (
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-aff-blue-deep to-aff-sky transition-all duration-200"
                    style={{ width: `${Math.max(4, stage.percent)}%` }}
                  />
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-muted-foreground mt-3">
            JPG, PNG, HEIC o PDF · las fotos se optimizan y suben solas · PDF hasta 3 MB
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.heic,.heif,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.tif,.tiff,.pdf,application/pdf"
            onChange={handleFile}
            disabled={busy}
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
