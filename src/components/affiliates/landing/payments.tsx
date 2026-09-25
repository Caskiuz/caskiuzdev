"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Smartphone, Landmark, Wallet, Coins, CreditCard, Info } from "lucide-react";
import { CLIENT_PAYMENT_METHODS, type PagoMovilInfo } from "@/lib/payments";
import { containerVariants, itemVariants } from "../variants";

const METHOD_ICONS: Record<string, typeof Smartphone> = {
  "Pago Móvil (Venezuela)": Smartphone,
  "Transferencia bancaria": Landmark,
  PayPal: Wallet,
  Binance: Coins,
  MercadoPago: CreditCard,
};

/**
 * Métodos de pago que aceptan los CLIENTES que refieren los afiliados.
 * Incluye Pago Móvil Venezuela cuando el dueño del sitio lo tiene configurado.
 */
export function ClientPayments({ pagoMovil }: { pagoMovil: PagoMovilInfo }) {
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
            {CLIENT_PAYMENT_METHODS.map((method) => {
              const Icon = METHOD_ICONS[method] ?? CreditCard;
              const isPagoMovil = method.startsWith("Pago Móvil");
              return (
                <motion.div
                  key={method}
                  variants={itemVariants}
                  className={`inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold border ${
                    isPagoMovil
                      ? "border-aff-cyan/40 bg-aff-blue/10 text-aff-cyan"
                      : "border-glass-border glass-card"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {method}
                </motion.div>
              );
            })}
          </motion.div>

          {/* Datos de Pago Móvil */}
          {pagoMovil.enabled ? (
            <motion.div variants={itemVariants} className="mt-8 metal-card rounded-2xl p-6 max-w-2xl mx-auto">
              <p className="text-sm font-bold mb-3 flex items-center gap-2 text-aff-cyan">
                <Smartphone className="w-4 h-4" /> Pago Móvil (Venezuela)
              </p>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-surface-hover border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Teléfono</p>
                  <p className="font-semibold">{pagoMovil.phone}</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Banco</p>
                  <p className="font-semibold">{pagoMovil.bank || "—"}</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Titular</p>
                  <p className="font-semibold">{pagoMovil.holder || "—"}</p>
                </div>
                <div className="rounded-xl bg-surface-hover border border-border p-3">
                  <p className="text-xs text-muted-foreground mb-0.5">Cédula / RIF</p>
                  <p className="font-semibold">{pagoMovil.id || "—"}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Ideal para clientes en Venezuela: comparte estos datos y el pago del
                anticipo queda confirmado en minutos.
              </p>
            </motion.div>
          ) : (
            <motion.p
              variants={itemVariants}
              className="mt-6 text-xs text-muted-foreground text-center flex items-center justify-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" /> El dueño del sitio puede activar los datos de
              Pago Móvil desde el panel de administración.
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
