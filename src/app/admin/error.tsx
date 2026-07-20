"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="glass-card p-8 max-w-lg w-full text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Error en el panel de administración</h2>
        <p className="text-sm text-muted-foreground mb-6 break-all">
          {process.env.NODE_ENV === "development"
            ? error.message
            : "Ocurrió un error inesperado al cargar el panel."}
        </p>
        {process.env.NODE_ENV === "development" && error.digest && (
          <p className="text-xs text-muted-foreground mb-4 font-mono">
            Digest: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all"
        >
          <RefreshCw className="w-4 h-4" />
          Intentar de nuevo
        </button>
      </div>
    </div>
  );
}