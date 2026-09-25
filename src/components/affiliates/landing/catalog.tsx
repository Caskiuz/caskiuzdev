"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp } from "lucide-react";
import type { ServiceItem } from "@/lib/services-defaults";
import { TIERS, formatUsd } from "@/lib/affiliate";
import { containerVariants, itemVariants } from "../variants";

function extractPrice(price: string): number | null {
  const match = price.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function Catalog({ services }: { services: ServiceItem[] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const minRate = TIERS[0].rate;
  const maxRate = TIERS[TIERS.length - 1].rate;

  return (
    <section className="py-24 relative" id="catalogo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="text-center mb-16"
        >
          <motion.h2 variants={itemVariants} className="text-3xl sm:text-4xl font-bold tracking-tight">
            Catálogo de <span className="metal-text">ofertas</span>
          </motion.h2>
          <motion.p variants={itemVariants} className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Estos son los servicios que puedes promocionar. La comisión se calcula sobre el
            monto efectivamente cobrado al cliente.
          </motion.p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {services.map((service) => {
            const price = extractPrice(service.price);
            return (
              <motion.div
                key={service.id}
                variants={itemVariants}
                className="metal-card rounded-2xl p-5 flex flex-col"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="font-bold leading-snug">{service.title}</h3>
                  {service.popular && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-gradient-to-r from-aff-blue to-aff-cyan">
                      POPULAR
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                  {service.description}
                </p>
                <div className="mt-auto space-y-3">
                  <p className="text-sm font-semibold">{service.price}</p>
                  {price !== null ? (
                    <div className="rounded-xl bg-surface-hover border border-glass-border p-3">
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mb-1">
                        <TrendingUp className="w-3 h-3 text-aff-cyan" /> Tu comisión
                      </p>
                      <p className="text-sm font-bold text-aff-cyan">
                        {formatUsd(price * minRate)} — {formatUsd(price * maxRate)}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        según tu nivel ({Math.round(minRate * 100)}% – {Math.round(maxRate * 100)}%)
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-surface-hover border border-glass-border p-3">
                      <p className="text-xs text-muted-foreground">
                        Comisión {Math.round(minRate * 100)}% – {Math.round(maxRate * 100)}% según tu nivel
                      </p>
                    </div>
                  )}
                  {service.deliveryTime && (
                    <p className="text-[11px] text-muted-foreground">
                      ⏱️ Entrega: {service.deliveryTime}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
