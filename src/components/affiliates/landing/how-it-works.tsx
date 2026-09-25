"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { UserPlus, Share2, MousePointerClick, DollarSign } from "lucide-react";
import { containerVariants, itemVariants } from "../variants";

const steps = [
  {
    icon: UserPlus,
    title: "1. Crea tu cuenta",
    text: "Regístrate gratis en 2 minutos. Recibe tu link único y tu código de referido al instante.",
  },
  {
    icon: Share2,
    title: "2. Comparte tu link",
    text: "Promuévelo en redes, tu blog, WhatsApp o email. Cada clic queda registrado con una cookie de 30 días.",
  },
  {
    icon: MousePointerClick,
    title: "3. Llegan tus referidos",
    text: "Cuando un cliente de tu link contrata un servicio, la venta se atribuye a ti automáticamente.",
  },
  {
    icon: DollarSign,
    title: "4. Cobra tu comisión",
    text: "Gana entre 10% y 40% de cada venta cobrada. Retira desde $30 USD en USDT, USDC, BTC o Binance Pay.",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="como-funciona">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold tracking-tight">
            ¿Cómo <span className="metal-text">funciona</span>?
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Un sistema simple y transparente: tú traes los clientes, nosotros hacemos el trabajo y
            tú cobras por cada venta.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map((step) => (
            <motion.div key={step.title} variants={itemVariants} className="metal-card rounded-2xl p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-aff-blue-deep to-aff-sky flex items-center justify-center mb-4 shadow-lg shadow-aff-blue/25">
                <step.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.text}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
