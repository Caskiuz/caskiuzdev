"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";

interface CVViewerProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
}

export function CVViewer({ isOpen, onClose, pdfUrl }: CVViewerProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Visor de currículum"
        >
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative z-10 w-full max-w-4xl h-[85vh] max-h-[900px] rounded-2xl border border-glass-border bg-surface shadow-2xl shadow-black/40 flex flex-col overflow-hidden"
          >
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface/50 backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-foreground">
                Currículum — Caskiuz
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all duration-200 shadow-lg shadow-primary/25"
                  aria-label="Descargar CV en PDF"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </a>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-surface-hover transition-colors text-muted-foreground hover:text-foreground"
                  aria-label="Cerrar visor"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* PDF viewer */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-900">
              <iframe
                src={pdfUrl}
                title="Currículum de Caskiuz"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}