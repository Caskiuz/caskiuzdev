"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Link2,
  BarChart3,
  Coins,
  FileText,
  Headphones,
  GraduationCap,
} from "lucide-react";
import { containerVariants, itemVariants } from "../variants";

const benefits = [
  {
    icon: Link2,
    title: "Tu link único",
    text: "URL corta con tu código + sub-IDs para medir cada campaña por separado.",
  },
  {
    icon: BarChart3,
    title: "Estadísticas en vivo",
    text: "Clics, leads, ventas, EPC y tasa de conversión en tu dashboard personal.",
  },
  {
    icon: Coins,
    title: "Pagos en cripto",
    text: "USDT y USDC en 6 redes, Bitcoin, o Binance Pay. Retiros desde $30 USD.",
  },
  {
    icon: FileText,
    title: "Materiales listos",
    text: "Banners, textos de promoción y guías para que vendas sin crear nada.",
  },
  {
    icon: Headphones,
    title: "Soporte dedicado",
    text: "Sistema de tickets y asistencia técnica para resolver tus dudas rápido.",
  },
  {
    icon: GraduationCap,
    title: "Guías y formación",
    text: "Tutoriales paso a paso: dónde promocionar, cómo hacer contenido que convierte.",
  },
];

export function Benefits() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="beneficios">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold tracking-tight">
            Todo lo que necesitas para <span className="metal-text">vender</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Un ecosistema completo, como las grandes redes de afiliados, hecho para que
            profesionales y creadores ganen dinero promocionando servicios reales.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {benefits.map((benefit) => (
            <motion.div
              key={benefit.title}
              variants={itemVariants}
              className="glass-card rounded-2xl p-6 hover:bg-surface-hover transition-colors"
            >
              <div className="w-11 h-11 rounded-xl bg-aff-blue/10 border border-aff-blue/20 flex items-center justify-center mb-4">
                <benefit.icon className="w-5 h-5 text-aff-cyan" />
              </div>
              <h3 className="font-bold mb-2">{benefit.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{benefit.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
