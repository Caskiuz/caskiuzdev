"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { containerVariants, itemVariants } from "../variants";

export function FinalCta() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-24 relative" id="unete">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="metal-border rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden"
        >
          {/* Orbes azules de fondo */}
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-aff-blue/15 blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-aff-cyan/15 blur-[100px] pointer-events-none" />

          <motion.h2
            variants={itemVariants}
            className="text-3xl sm:text-5xl font-bold tracking-tight relative"
          >
            Convierte tu audiencia
            <br />
            en <span className="metal-text">ingresos</span>
          </motion.h2>
          <motion.p
            variants={itemVariants}
            className="mt-6 text-muted-foreground text-lg max-w-xl mx-auto relative"
          >
            Cientos de negocios buscan desarrollo web, apps y SEO cada día. Tú los
            conectas con Caskiuz y ganas por cada proyecto.
          </motion.p>
          <motion.div variants={itemVariants} className="mt-10 flex flex-wrap justify-center gap-4 relative">
            <Link
              href="/afiliados/registro"
              className="btn-aff metal-shine px-8 py-4 text-base"
            >
              Únete gratis ahora <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/afiliados/login"
              className="px-8 py-4 text-base font-semibold rounded-xl border border-glass-border glass-card hover:bg-surface-hover transition-colors"
            >
              Ya tengo cuenta
            </Link>
          </motion.div>
          <motion.p
            variants={itemVariants}
            className="mt-6 text-xs text-muted-foreground relative"
          >
            Al registrarte aceptas los{" "}
            <Link href="/afiliados/terminos" className="text-aff-cyan hover:underline">
              Términos y Condiciones
            </Link>{" "}
            del programa.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
