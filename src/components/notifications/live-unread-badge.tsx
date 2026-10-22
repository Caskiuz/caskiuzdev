"use client";

import { useEffect, useState } from "react";

/**
 * Contador de avisos sin leer que se refresca solo (cada 45 s) sin recargar.
 *
 * El valor del servidor llega como `initialCount`. El padre lo usa también
 * como `key`, así cuando el servidor recalcula el contador (p. ej. al marcar
 * leídas) el componente se remonta con el valor fresco.
 */
export function LiveUnreadBadge({
  initialCount,
  endpoint,
  className,
}: {
  initialCount: number;
  endpoint: string;
  className: string;
}) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const id = setInterval(async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count?: number };
        if (typeof data.count === "number") setCount(data.count);
      } catch {
        // sin conexión: se reintenta en el próximo ciclo
      }
    }, 45000);
    return () => clearInterval(id);
  }, [endpoint]);

  if (count <= 0) return null;
  return <span className={className}>{count > 9 ? "9+" : count}</span>;
}
