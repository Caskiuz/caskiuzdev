"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { TIERS } from "@/lib/affiliate";
import { containerVariants, itemVariants } from "../variants";

const tierPerks = [
  "Comisión sobre ventas cobradas",
  "Link único + sub-IDs de campaña",
  "Materiales promocionales incluidos",
  "Retiros en USDT, USDC, BTC o Binance Pay",
];

export function Tiers() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="niveles">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold tracking-tight">
            Niveles que <span className="metal-text">crecen contigo</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Entrar es gratis. Cuanto más vendes, mayor es tu comisión: sube de nivel
            automáticamente según tu volumen de ventas referidas cobradas.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {TIERS.map((tier, i) => (
            <motion.div
              key={tier.key}
              variants={itemVariants}
              className={`relative rounded-2xl p-6 ${
                i === TIERS.length - 1 ? "metal-border" : "metal-card"
              }`}
            >
              {i === TIERS.length - 1 && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r from-aff-blue to-aff-cyan">
                  TOP AFILIADO
                </span>
              )}
              <div className="text-3xl mb-3">{tier.emoji}</div>
              <h3 className="font-bold text-lg">{tier.name}</h3>
              <p className="metal-text text-4xl font-bold my-3">{Math.round(tier.rate * 100)}%</p>
              <p className="text-xs text-muted-foreground mb-4">
                {tier.minRevenue === 0
                  ? "Desde tu primera venta"
                  : `Desde $${tier.minRevenue.toLocaleString("en-US")} USD referidos`}
              </p>
              <ul className="space-y-2 mb-6">
                {tierPerks.map((perk) => (
                  <li key={perk} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Check className="w-3.5 h-3.5 text-aff-cyan shrink-0 mt-0.5" />
                    {perk}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mt-12"
        >
          <Link
            href="/afiliados/registro"
            className="btn-aff metal-shine px-7 py-3.5 inline-flex items-center gap-2"
          >
            Empieza gratis <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-xs text-muted-foreground mt-3">Sin cuotas de entrada · Sin mínimo de ventas</p>
        </motion.div>
      </div>
    </section>
  );
}
