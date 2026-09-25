"use client";

import { motion } from "framer-motion";

/**
 * Gráfica de barras CSS de clics por día (últimos 30 días).
 * Los datos ya vienen normalizados desde el servidor (ventana completa).
 * Sin librerías de charts: liviano y rápido.
 */
export function ClicksChart({ data }: { data: { date: string; count: number }[] }) {
  const bars = data.length > 0 ? data : [];
  const max = Math.max(1, ...bars.map((b) => b.count));

  return (
    <div>
      <div className="flex items-end gap-[3px] h-36">
        {bars.map((bar, i) => (
          <motion.div
            key={bar.date}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(4, (bar.count / max) * 100)}%` }}
            transition={{ duration: 0.5, delay: i * 0.008 }}
            className="flex-1 rounded-t bg-gradient-to-t from-aff-blue-deep to-aff-cyan min-h-[4px]"
            title={`${bar.date}: ${bar.count} clics`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
        <span>{bars[0]?.date.slice(5) ?? ""}</span>
        <span>{bars[Math.floor(bars.length / 2)]?.date.slice(5) ?? ""}</span>
        <span>{bars[bars.length - 1]?.date.slice(5) ?? ""}</span>
      </div>
    </div>
  );
}
