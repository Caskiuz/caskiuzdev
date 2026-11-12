"use client";

import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { motion, useInView, useScroll, useTransform, animate } from "framer-motion";
import { ExternalLink, MessageCircle, FileDown } from "lucide-react";
import Link from "next/link";
import { CVViewer } from "@/components/ui/cv-viewer";
import { useReferralCode, appendReferralCode } from "@/lib/referral-cookie";
import { useEffectsOff } from "@/components/layout/site-fx";

const Hero3D = lazy(() => import("@/components/ui/hero-3d"));

interface HeroProps {
  config?: Record<string, string>;
}

/** Strip tecnológico que se desplaza al pie del Hero */
const TECH_MARQUEE = [
  "React", "Next.js", "TypeScript", "Node.js", "Python", "FastAPI",
  "MySQL", "PostgreSQL", "MongoDB", "Docker", "AWS", "n8n",
  "Gemini IA", "Three.js", "Prisma", "Tailwind",
];

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

/** Nombre del título revelado letra por letra (con blur-in escalonado). */
function RevealName({ name }: { name: string }) {
  return (
    <span className="inline-flex flex-wrap" aria-label={name}>
      {name.split("").map((ch, i) => (
        <motion.span
          key={`${ch}-${i}`}
          className="metal-text inline-block"
          variants={{
            hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.45, delay: 0.15 + i * 0.045 },
            },
          }}
          aria-hidden
        >
          {ch === " " ? "\u00A0" : ch}
        </motion.span>
      ))}
    </span>
  );
}

/** Stat con contador animado (3+ / 50+ / 30+ — respeta el sufijo del config). */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const match = value.match(/^(\d+)(.*)$/);

  useEffect(() => {
    if (!match || !inView || !ref.current) return;
    const target = parseInt(match[1], 10);
    const suffix = match[2];
    const controls = animate(0, target, {
      duration: 1.4,
      ease: "easeOut",
      onUpdate: (v) => {
        if (ref.current) ref.current.textContent = `${Math.round(v)}${suffix}`;
      },
    });
    return () => controls.stop();
  }, [inView, match, value]);

  return (
    <div className="metal-card spotlight-card rounded-xl p-3">
      <p className="text-sm sm:text-base font-bold text-aff-cyan" ref={ref}>
        {value}
      </p>
      <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}

export function Hero({ config = {} }: HeroProps) {
  const c = (key: string, fallback: string) => config[key] || fallback;
  const [isCVViewerOpen, setIsCVViewerOpen] = useState(false);
  const referralCode = useReferralCode();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const fxOff = useEffectsOff();

  // Parallax ligado al scroll (desactivado en modo sin efectos)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const bgOpacity = useTransform(scrollYProgress, [0, 1], [0.35, 0.08]);
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const copyOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.15]);
  const emblemY = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const emblemScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);

  return (
    <section
      ref={ref}
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden aff-glow pt-16"
    >
      {/* Mismo fondo que la landing de afiliados: grid sutil + glow azul (con parallax) */}
      <motion.div
        className="absolute inset-0 opacity-[0.35]"
        style={
          fxOff
            ? undefined
            : {
                y: bgY,
                opacity: bgOpacity,
                backgroundImage:
                  "linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)",
                backgroundSize: "60px 60px",
              }
        }
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 grid lg:grid-cols-2 gap-12 items-center">
        {/* Copy (wrapper con parallax; adentro, la entrada escalonada) */}
        <motion.div style={fxOff ? undefined : { y: copyY, opacity: copyOpacity }}>
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
              <RevealName name={c("hero_name", "Caskiuz")} />
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

            {/* Stats — tarjetas metálicas con contadores animados */}
            <motion.div
              variants={itemVariants}
              className="mt-10 grid grid-cols-3 gap-4 max-w-lg text-center"
            >
              <AnimatedStat
                value={c("hero_stat_1_value", "3+")}
                label={c("hero_stat_1_label", "Años de experiencia")}
              />
              <AnimatedStat
                value={c("hero_stat_2_value", "50+")}
                label={c("hero_stat_2_label", "Proyectos completados")}
              />
              <AnimatedStat
                value={c("hero_stat_3_value", "30+")}
                label={c("hero_stat_3_label", "Clientes satisfechos")}
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Emblema 3D animado (con parallax; en modo sin efectos, logo estático) */}
        <motion.div
          style={fxOff ? undefined : { y: emblemY, scale: emblemScale }}
          className="relative h-72 sm:h-96 lg:h-[520px] order-first lg:order-last"
        >
          {fxOff ? (
            <LogoFallback />
          ) : (
            <Suspense fallback={<LogoFallback />}>
              <Hero3D />
            </Suspense>
          )}
        </motion.div>
      </div>

      {/* Marquee de tecnologías */}
      <div className="fx-marquee absolute bottom-20 left-0 right-0" aria-hidden>
        <div className="fx-marquee-track">
          {[0, 1].map((half) => (
            <div key={half} className="flex items-center gap-10 pr-10">
              {TECH_MARQUEE.map((t) => (
                <span
                  key={t}
                  className="text-sm font-medium text-muted-foreground/50 whitespace-nowrap"
                >
                  {t}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator con forma de mouse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden
      >
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/40 flex items-start justify-center p-1.5">
          <motion.div
            className="w-1 h-2 rounded-full bg-aff-cyan"
            animate={fxOff ? undefined : { y: [0, 12, 0], opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
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
