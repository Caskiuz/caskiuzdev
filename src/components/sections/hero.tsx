"use client";

import { Suspense, lazy, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowDown, ExternalLink, MessageCircle, FileDown } from "lucide-react";
import Link from "next/link";
import { CVViewer } from "@/components/ui/cv-viewer";
import { useReferralCode, appendReferralCode } from "@/lib/referral-cookie";

const Hero3D = lazy(() => import("@/components/ui/hero-3d"));

interface HeroProps {
  config?: Record<string, string>;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

function LogoFallback() {
  return (
    <div className="w-64 h-64 sm:w-80 sm:h-80 rounded-full flex items-center justify-center relative">
      <div className="absolute inset-0 rounded-full border-2 border-aff-blue/20 animate-pulse-glow" />
      <div className="absolute inset-8 rounded-full border border-aff-cyan/30" />
      <span className="metal-text text-9xl font-bold">C</span>
    </div>
  );
}

/** Logo de LinkedIn en SVG (esta versión de lucide no incluye iconos de marca). */
function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.55C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}

export function Hero({ config = {} }: HeroProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;
  const [isCVViewerOpen, setIsCVViewerOpen] = useState(false);
  const referralCode = useReferralCode();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section
      ref={ref}
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden aff-glow pt-16"
    >
      {/* Mismo fondo que la landing de afiliados: grid sutil + glow azul */}
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
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-muted-foreground">
              {c("hero_badge", "Disponible para nuevos proyectos")}
            </span>
          </motion.div>

          {/* Título */}
          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          >
            <span className="text-foreground">Hola, soy </span>
            <span className="metal-text">{c("hero_name", "Caskiuz")}</span>
            <br />
            <span className="text-aff-cyan whitespace-pre-line">
              {c("hero_title", "Full-Stack Developer\n& Software Architect")}
            </span>
          </motion.h1>

          {/* Subtítulo */}
          <motion.p
            variants={itemVariants}
            className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl"
          >
            {c("hero_subtitle", "Full-Stack Developer con dominio en React, Next.js, TypeScript, Node.js, Python, FastAPI, MySQL, PostgreSQL, MongoDB, Docker, AWS, Vercel y APIs con IA integrada. Construyo productos digitales completos: desde el frontend y backend hasta la infraestructura en la nube.")}
          </motion.p>

          {/* CTAs */}
          <motion.div variants={itemVariants} className="mt-8 flex flex-wrap gap-4">
            <button
              onClick={() => setIsCVViewerOpen(true)}
              className="btn-aff metal-shine px-7 py-3.5 text-base cursor-pointer"
            >
              <FileDown className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {c("hero_cta_cv", "Ver CV")}
            </button>
            <Link
              href="https://www.linkedin.com/in/ricardo-agelvis-9489a9370"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl border border-glass-border glass-card hover:bg-surface-hover transition-colors"
            >
              <LinkedInIcon className="w-5 h-5 text-[#0A66C2]" />
              Ver LinkedIn
            </Link>
            <Link
              href={`https://wa.me/${c("contact_whatsapp", "584262931869").replace(/\D/g, "")}?text=${encodeURIComponent(appendReferralCode("Hola Caskiuz! 👋 Vi tu portfolio y quiero conversar sobre un proyecto.", referralCode))}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-xl transition-all duration-200 shadow-xl shadow-[#25D366]/30 hover:shadow-[#25D366]/50 hover:-translate-y-0.5"
            >
              <MessageCircle className="w-5 h-5" />
              {c("hero_cta_primary", "Escríbeme por WhatsApp")}
            </Link>
            <Link
              href="#projects"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-base font-semibold rounded-xl border border-glass-border glass-card hover:bg-surface-hover transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              {c("hero_cta_secondary", "Ver proyectos")}
            </Link>
          </motion.div>

          {/* Stats — tarjetas metálicas como en afiliados */}
          <motion.div
            variants={itemVariants}
            className="mt-10 grid grid-cols-3 gap-4 max-w-lg text-center"
          >
            {[
              { value: c("hero_stat_1_value", "3+"), label: c("hero_stat_1_label", "Años de experiencia") },
              { value: c("hero_stat_2_value", "50+"), label: c("hero_stat_2_label", "Proyectos completados") },
              { value: c("hero_stat_3_value", "30+"), label: c("hero_stat_3_label", "Clientes satisfechos") },
            ].map((stat) => (
              <div key={stat.label} className="metal-card rounded-xl p-3">
                <p className="text-sm sm:text-base font-bold text-aff-cyan">{stat.value}</p>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* Emblema 3D animado */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative h-72 sm:h-96 lg:h-[520px] order-first lg:order-last"
        >
          <Suspense fallback={<LogoFallback />}>
            <Hero3D />
          </Suspense>
        </motion.div>
      </div>

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

      {/* CV Viewer Modal */}
      <CVViewer
        isOpen={isCVViewerOpen}
        onClose={() => setIsCVViewerOpen(false)}
        pdfUrl="/images/cv-caskiuz.pdf"
      />
    </section>
  );
}
