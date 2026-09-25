"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, Landmark, Wallet, Coins, CreditCard, Globe, Info } from "lucide-react";
import type { PaymentMethodInfo } from "@/lib/payments";
import { containerVariants, itemVariants } from "../variants";

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  "pago-movil": Smartphone,
  "zelle": Landmark,
  "paypal": Wallet,
  "binance": Coins,
  "western-union": Globe,
  "crypto": CreditCard,
};

/**
 * Métodos de pago que acepta Caskiuz de los CLIENTES que refieren los
 * afiliados: Pago Móvil (Venezuela), Zelle, PayPal, Binance, Western
 * Union y cripto (USDT/USDC/BTC). Los datos públicos se muestran solo
 * para los métodos que el dueño configuró en el admin.
 */
export function ClientPayments({ methods }: { methods: PaymentMethodInfo[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const withDetail = methods.filter((m) => m.detail);
  const pagoMovil = methods.find((m) => m.id === "pago-movil");

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
              const Icon = METHOD_ICONS[method.id] ?? CreditCard;
              return (
                <motion.div
                  key={method.id}
                  variants={itemVariants}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border ${
                    method.id === "pago-movil"
                      ? "border-aff-cyan/40 bg-aff-blue/10 text-aff-cyan"
                      : "border-glass-border glass-card"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {method.label}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Detalles de los métodos configurados */}
          {withDetail.length > 0 ? (
            <div className="mt-8 grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
              {withDetail.map((method) => {
                const Icon = METHOD_ICONS[method.id] ?? CreditCard;
                return (
                  <motion.div key={method.id} variants={itemVariants} className="metal-card rounded-2xl p-5">
                    <p className="text-sm font-bold mb-2 flex items-center gap-2 text-aff-cyan">
                      <Icon className="w-4 h-4" /> {method.label}
                    </p>
                    <p className="text-sm text-muted-foreground break-all leading-relaxed">
                      {method.detail}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <motion.p
              variants={itemVariants}
              className="mt-6 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" /> El dueño del sitio publica aquí los datos de pago
              (teléfono Pago Móvil, Zelle, PayPal, wallets) desde su panel de administración.
            </motion.p>
          )}

          {pagoMovil?.detail && (
            <motion.p variants={itemVariants} className="mt-6 text-center text-xs text-muted-foreground">
              📲 Ideal para clientes en Venezuela: comparte los datos de Pago Móvil y el pago
              del anticipo queda confirmado en minutos.
            </motion.p>
          )}

          <motion.p variants={itemVariants} className="mt-6 text-center text-xs text-muted-foreground">
            💡 Tu comisión se paga aparte, siempre en USDT, USDC, BTC o Binance Pay.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
