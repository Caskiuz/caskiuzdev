"use client";

import { useEffect, useCallback } from "react";
import { X, Download } from "lucide-react";

interface DocumentViewerProps {
  fileName: string | null;
  fileData: string;
  onClose: () => void;
}

/**
 * Visor de documentos KYC: muestra imágenes directamente y PDFs en un iframe
 * (visor nativo del navegador). Incluye botón de descarga para dispositivos
 * donde el PDF no se renderiza dentro del iframe (ej: Safari de iPhone).
 */
export function DocumentViewer({ fileName, fileData, onClose }: DocumentViewerProps) {
  const isPdf = fileData.startsWith("data:application/pdf");

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Visor de documento"
    >
      <div
        className="w-full max-w-3xl h-[85vh] bg-surface rounded-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-2 border-b border-border shrink-0">
          <p className="text-sm font-medium truncate">{fileName || "Documento"}</p>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={fileData}
              download={fileName || "documento"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-surface-hover transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> Descargar
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-hover transition-colors"
              aria-label="Cerrar visor"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-gray-100 dark:bg-gray-900">
          {isPdf ? (
            <iframe
              src={fileData}
              title="Vista previa del documento"
              className="w-full h-full border-0"
              allow="fullscreen"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={fileData} alt="Vista previa del documento" className="w-full" />
          )}
        </div>

        {isPdf && (
          <p className="px-4 py-2 text-xs text-muted-foreground border-t border-border shrink-0">
            Si el PDF no se muestra en tu dispositivo, usa «Descargar» para abrirlo.
          </p>
        )}
      </div>
    </div>
  );
}
