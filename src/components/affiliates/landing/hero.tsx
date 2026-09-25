"use client";

import { Suspense, lazy, useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck, Wallet } from "lucide-react";
import { containerVariants, itemVariants } from "../variants";

const Hero3D = lazy(() => import("../hero-3d"));

function LogoFallback() {
  return (
    <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center relative">
      <div className="absolute inset-0 rounded-full border-2 border-aff-blue/20 animate-pulse-glow" />
      <div className="absolute inset-8 rounded-full border border-aff-cyan/30" />
      <span className="metal-text text-9xl font-bold">C</span>
    </div>
  );
}

export function AffiliateHero() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden aff-glow" id="home">
      {/* Grid pattern sutil */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy */}
        <motion.div
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm"
          >
            <Sparkles className="w-4 h-4 text-aff-cyan" />
            <span className="text-muted-foreground">Red oficial de afiliados de Caskiuz</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          >
            Gana <span className="metal-text">hasta 40%</span> de comisión
            <br />
            vendiendo <span className="text-aff-cyan">servicios digitales</span>
          </motion.h1>

          <motion.p variants={itemVariants} className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
            Únete gratis, comparte tu link único y cobra comisiones en{" "}
            <strong className="text-foreground">USDT, USDC, Bitcoin o Binance Pay</strong> por
            cada venta de desarrollo web, apps, e-commerce y SEO que refieras.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-4">
            <Link href="/afiliados/registro" className="btn-aff metal-shine px-7 py-3.5 text-base">
              Crear cuenta gratis <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/afiliados/login"
              className="px-7 py-3.5 text-base font-semibold rounded-xl border border-glass-border glass-card hover:bg-surface-hover transition-colors"
            >
              Iniciar sesión
            </Link>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="mt-10 grid grid-cols-3 gap-4 max-w-md text-center"
          >
            {[
              { value: "10-40%", label: "Comisión por venta" },
              { value: "USDT · USDC · BTC", label: "Pagos en cripto" },
              { value: "Gratis", label: "Unirse a la red" },
            ].map((stat) => (
              <div key={stat.label} className="metal-card rounded-xl p-3">
                <p className="text-sm sm:text-base font-bold text-aff-cyan">{stat.value}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-aff-cyan" /> Pagos verificados
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-aff-cyan" /> Retiros desde $30 USD
            </span>
          </motion.div>
        </motion.div>

        {/* Escena 3D */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-72 sm:h-96 lg:h-[520px] order-first lg:order-last"
        >
          <Suspense fallback={<LogoFallback />}>
            <Hero3D />
          </Suspense>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-transparent via-transparent to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
