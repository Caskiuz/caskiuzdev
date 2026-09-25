"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Marca de Caskiuz: badge cromado con efecto 3D, brillo animado y
 * un nodo de datos orbitando (identidad "digital" de la red de afiliados).
 * Reutilizable en navbar, footer, panel de afiliados y páginas de auth
 * para mantener todo consistente.
 */
export function BrandLogo({
  size = 34,
  className,
  orbit = true,
}: {
  size?: number;
  className?: string;
  orbit?: boolean;
}) {
  return (
    <motion.div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size, perspective: 220 }}
      whileHover={{ rotateY: 18, rotateX: -10, scale: 1.08 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
    >
      {/* Borde cromado + interior */}
      <div
        className="absolute inset-0 rounded-xl p-[1.6px]"
        style={{
          background:
            "linear-gradient(140deg, #f8fafc 0%, #9aa7b8 32%, #475569 55%, #e2e8f0 78%, #7c8ba1 100%)",
          boxShadow: "0 4px 16px rgba(29,78,216,0.28), inset 0 1px 0 rgba(255,255,255,0.4)",
        }}
      >
        <div className="w-full h-full rounded-[10px] bg-[#0b0d14] relative overflow-hidden flex items-center justify-center">
          {/* Reflejo superior */}
          <span
            className="absolute inset-x-0 top-0 h-1/2 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0))",
            }}
          />
          {/* "C" cromada */}
          <span
            className="metal-text font-black leading-none select-none"
            style={{ fontSize: size * 0.56, marginTop: -size * 0.02 }}
          >
            C
          </span>
          {/* Barrido de brillo */}
          <span className="absolute inset-0 metal-shine pointer-events-none" />
        </div>
      </div>

      {/* Nodo de datos orbitando el badge */}
      {orbit && (
        <span
          className="brand-orbit absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full pointer-events-none"
          style={
            {
              background: "#38bdf8",
              boxShadow: "0 0 8px #38bdf8, 0 0 16px rgba(56,189,248,0.5)",
              marginLeft: -3,
              marginTop: -3,
              "--orbit-r": `${size * 0.66}px`,
            } as React.CSSProperties
          }
        />
      )}
    </motion.div>
  );
}
