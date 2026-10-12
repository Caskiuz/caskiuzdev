"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Info } from "lucide-react";
import type { PublicPaymentMethodInfo } from "@/lib/payments";
import {
  CLIENT_PAYMENT_ICONS,
  CLIENT_ICON_CLASS_SM,
} from "@/components/ui/payment-icons";
import { containerVariants, itemVariants } from "../variants";

/**
 * Métodos de pago que acepta Caskiuz de los CLIENTES que refieren los
 * afiliados: Zelle, PayPal, Binance, Western Union y cripto
 * (USDT/USDC/BTC). Aquí solo se muestran los NOMBRES y logos: los datos de
 * cada cuenta (emails, wallets) son privados y viven únicamente en el panel
 * del afiliado (Catálogo) y en el admin.
 */
export function ClientPayments({ methods }: { methods: PublicPaymentMethodInfo[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="pagos-clientes">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tus referidos pagan <span className="metal-text">fácil</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Estos son los métodos de pago que aceptamos de los clientes. Más
              opciones = más fácil cerrar la venta para ti.
            </p>
          </motion.div>

          {/* Chips de métodos */}
          <motion.div
            variants={containerVariants}
            className="flex flex-wrap justify-center gap-3"
          >
            {methods.map((method) => {
              const Icon = CLIENT_PAYMENT_ICONS[method.id];
              return (
                <motion.div
                  key={method.id}
                  variants={itemVariants}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border border-glass-border glass-card"
                >
                  {Icon ? (
                    <Icon className={CLIENT_ICON_CLASS_SM[method.id] ?? CLIENT_ICON_CLASS_SM.default} />
                  ) : (
                    <Info className="w-4 h-4" />
                  )}
                  {method.label}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Los datos de cobro son privados: se consultan en el panel */}
          <motion.p
            variants={itemVariants}
            className="mt-8 text-sm text-muted-foreground text-center flex items-center justify-center gap-1.5"
          >
            <Info className="w-4 h-4 shrink-0 text-aff-cyan" />
            Los datos de cada cuenta (emails, wallets) están en tu panel →
            Catálogo, solo con tu sesión de afiliado.
          </motion.p>

          <motion.p variants={itemVariants} className="mt-6 text-center text-xs text-muted-foreground">
            📲 ¿Eres afiliado? Cobra tus comisiones por PayPal en cualquier país 🌎 o con método
            local según tu país: Pago Móvil en Venezuela 🇻🇪, Nequi/Bancolombia/Daviplata en
            Colombia 🇨🇴, Yape en Perú 🇵🇪 y Zelle en EE. UU. 🇺🇸, desde tu panel → Comisiones y
            retiros.
          </motion.p>

          <motion.p variants={itemVariants} className="mt-6 text-center text-xs text-muted-foreground">
            💡 Tu comisión también se paga en USDT, USDC, BTC, Binance Pay o PayPal.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
