"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, Sparkles, Code2, Rocket, ExternalLink } from "lucide-react";
import Link from "next/link";

interface HeroProps {
  config?: Record<string, string>;
}

export function Hero({ config = {} }: HeroProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;

  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8]);

  const floatingIcons = [
    { Icon: Code2, className: "top-20 left-[10%] animate-float", delay: 0 },
    { Icon: Sparkles, className: "top-40 right-[15%] animate-float", delay: 2 },
    { Icon: Rocket, className: "bottom-32 left-[20%] animate-float", delay: 4 },
  ];

  const phoneNumber = "584262931869";
  const message = encodeURIComponent(
    "¡Hola Caskiuz! 👋 Vi tu portfolio y me interesa trabajar contigo."
  );

  return (
    <section
      ref={containerRef}
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(108,92,231,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(0,210,255,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,107,107,0.08),transparent_50%)]" />

        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Animated orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/20 blur-[100px]"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-secondary/10 blur-[120px]"
          animate={{
            x: [0, -40, 0],
            y: [0, 40, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Floating icons (desktop) */}
      <div className="hidden lg:block absolute inset-0 -z-5 pointer-events-none">
        {floatingIcons.map(({ Icon, className, delay }, i) => (
          <motion.div
            key={i}
            className={`absolute ${className}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 4, delay, repeat: Infinity }}
          >
            <div className="glass-card p-4">
              <Icon className="w-8 h-8 text-primary" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content */}
      <motion.div
        style={{ y, opacity, scale }}
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm font-medium mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
          {c("hero_badge", "Disponible para nuevos proyectos")}
        </motion.div>

        {/* Main heading */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6"
        >
          <span className="text-foreground">Hola, soy </span>
          <span className="gradient-text">{c("hero_name", "Caskiuz")}</span>
          <br />
          <span className="text-foreground whitespace-pre-line">
            {c("hero_title", "Full-Stack Developer\n& Software Architect")}
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {c("hero_subtitle", "Construyo aplicaciones web y mobile de alto rendimiento que elevan tu negocio al siguiente nivel. Especializado en React, Next.js, Node.js y arquitecturas escalables en la nube.")}
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="#contact"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all duration-200 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5 group-hover:animate-pulse" />
            {c("hero_cta_primary", "¡Trabajemos juntos!")}
          </Link>
          <Link
            href="#projects"
            className="group w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-semibold text-foreground bg-surface hover:bg-surface-hover border border-border rounded-full transition-all duration-200 hover:-translate-y-0.5"
          >
            <ExternalLink className="w-5 h-5 group-hover:rotate-45 transition-transform" />
            {c("hero_cta_secondary", "Ver proyectos")}
          </Link>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 sm:gap-12"
        >
          {[
            { value: c("hero_stat_1_value", "3+"), label: c("hero_stat_1_label", "Años de experiencia") },
            { value: c("hero_stat_2_value", "50+"), label: c("hero_stat_2_label", "Proyectos completados") },
            { value: c("hero_stat_3_value", "30+"), label: c("hero_stat_3_label", "Clientes satisfechos") },
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl sm:text-4xl font-bold gradient-text">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-muted-foreground"
        >
          <ArrowDown className="w-6 h-6" />
        </motion.div>
      </motion.div>
    </section>
  );
}