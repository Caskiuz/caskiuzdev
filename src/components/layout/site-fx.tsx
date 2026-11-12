"use client";

import { useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { motion, useScroll, useSpring, MotionConfig } from "framer-motion";

/**
 * Capa de efectos inmersivos del sitio (estilo audaz):
 * - Scroll suave con Lenis (expuesto en window.__lenis para anchors y tabs)
 * - Barra de progreso de scroll metálica
 * - Cursor personalizado con estela de partículas (solo desktop, pointer:fine)
 * - Fondo reactivo al mouse (glow radial que sigue el cursor en toda la web)
 * - Spotlight en tarjetas (.spotlight-card) vía delegación de eventos
 * - Easter egg del título de la pestaña al cambiar de tab
 * - "Modo sin efectos": toggle accesible (footer) + prefers-reduced-motion;
 *   desactiva Lenis, el 3D del Hero y toda animación decorativa.
 *
 * Inspirado en los sitios inmersivos de referencia (Lusion, Apple,
 * Yamauchi No.10) siguiendo tres reglas: movimiento con propósito,
 * rendimiento primero y una alternativa liviana para quien la prefiera.
 */

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

const EFFECTS_EVENT = "caskiuz:effects";
const EFFECTS_KEY = "caskiuz_effects_off";

/** Hook para que otros componentes (Hero 3D, marquee) respeten el modo sin efectos. */
export function useEffectsOff(): boolean {
  const [off, setOff] = useState(false);
  useEffect(() => {
    const read = () => setOff(document.body.classList.contains("effects-off"));
    read();
    window.addEventListener(EFFECTS_EVENT, read);
    return () => window.removeEventListener(EFFECTS_EVENT, read);
  }, []);
  return off;
}

/** Toggle del modo sin efectos, montado en el footer. */
export function EffectsToggle() {
  const [off, setOff] = useState<boolean | null>(null);
  useEffect(() => {
    const read = () => setOff(document.body.classList.contains("effects-off"));
    read();
    window.addEventListener(EFFECTS_EVENT, read);
    return () => window.removeEventListener(EFFECTS_EVENT, read);
  }, []);

  const toggle = () => {
    const next = !document.body.classList.contains("effects-off");
    document.body.classList.toggle("effects-off", next);
    try {
      localStorage.setItem(EFFECTS_KEY, next ? "1" : "0");
    } catch {
      /* almacenamiento bloqueado: el modo solo vive en esta sesión */
    }
    window.dispatchEvent(new CustomEvent(EFFECTS_EVENT));
  };

  if (off === null) return null; // evita parpadeo de hidratación

  return (
    <button
      onClick={toggle}
      className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-aff-cyan transition-colors cursor-pointer"
      aria-pressed={off}
      title={off ? "Activar animaciones y efectos" : "Desactivar animaciones y efectos (modo liviano)"}
    >
      {off ? "✨ Activar efectos" : "🌿 Modo sin efectos"}
    </button>
  );
}

/** Cursor + estela + glow reactivo (solo se monta si los efectos están activos). */
function CursorFx() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Solo dispositivos con puntero fino (desktop); en táctiles no hay cursor.
    if (!window.matchMedia("(pointer: fine)").matches) return;
    document.body.classList.add("fx-cursor");

    const canvas = canvasRef.current;
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!canvas || !dot || !ring) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    let mx = -100, my = -100, rx = -100, ry = -100;
    let lastX = -100, lastY = -100;
    let interactive = false;
    const trail: { x: number; y: number; life: number; size: number }[] = [];

    const onMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;

      // Estela: partícula solo si se movió lo suficiente (throttle por distancia)
      const dist = Math.hypot(mx - lastX, my - lastY);
      if (dist > 7) {
        lastX = mx;
        lastY = my;
        trail.push({ x: mx, y: my, life: 1, size: 9 + Math.random() * 7 });
        if (trail.length > 36) trail.shift();
      }

      // Spotlight de tarjetas + vars del glow global (sin re-render)
      const card = (e.target as HTMLElement).closest?.(".spotlight-card") as HTMLElement | null;
      if (card) {
        const r = card.getBoundingClientRect();
        card.style.setProperty("--mx", `${e.clientX - r.left}px`);
        card.style.setProperty("--my", `${e.clientY - r.top}px`);
      }
      document.documentElement.style.setProperty("--mx", `${mx}px`);
      document.documentElement.style.setProperty("--my", `${my}px`);

      const t = e.target as HTMLElement;
      interactive = Boolean(
        t.closest?.("a, button, input, textarea, select, [role='button'], details > summary")
      );
    };

    document.addEventListener("mousemove", onMove, { passive: true });

    let raf = requestAnimationFrame(function loop() {
      // Anillo con lerp (retardo suave) — se agranda sobre elementos interactivos
      rx += (mx - rx) * 0.18;
      ry += (my - ry) * 0.18;
      const scale = interactive ? 1.7 : 1;
      ring.style.transform = `translate(${rx - 16}px, ${ry - 16}px) scale(${scale})`;
      ring.style.opacity = interactive ? "0.95" : "0.6";
      dot.style.transform = `translate(${mx - 3}px, ${my - 3}px)`;

      // Estela en canvas
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      for (let i = trail.length - 1; i >= 0; i--) {
        const p = trail[i];
        p.life -= 0.042;
        if (p.life <= 0) {
          trail.splice(i, 1);
          continue;
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${0.22 * p.life})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    });

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", resize);
      document.body.classList.remove("fx-cursor");
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fx-trail-canvas" aria-hidden />
      <div ref={ringRef} className="fx-cursor-ring" aria-hidden />
      <div ref={dotRef} className="fx-cursor-dot" aria-hidden />
    </>
  );
}

export function SiteFx({ children }: { children: React.ReactNode }) {
  const [fxOff, setFxOff] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  // Estado inicial: preferencia guardada o prefers-reduced-motion
  useEffect(() => {
    let stored = false;
    try {
      stored = localStorage.getItem(EFFECTS_KEY) === "1";
    } catch {
      /* sin localStorage: solo reduced-motion */
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const off = stored || reduced;
    document.body.classList.toggle("effects-off", off);
    setFxOff(off);
  }, []);

  // El toggle del footer dispara el evento: SiteFx sincroniza su propio estado
  // (MotionConfig + Lenis reaccionan al vuelo).
  useEffect(() => {
    const sync = () => setFxOff(document.body.classList.contains("effects-off"));
    window.addEventListener(EFFECTS_EVENT, sync);
    return () => window.removeEventListener(EFFECTS_EVENT, sync);
  }, []);

  // Lenis: scroll suave (destruido en modo sin efectos)
  useEffect(() => {
    if (fxOff) return;
    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      touchMultiplier: 1.4,
    });
    window.__lenis = lenis;
    let raf = requestAnimationFrame(function loop(time: number) {
      lenis.raf(time);
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
      window.__lenis = undefined;
    };
  }, [fxOff]);

  // Anchors internos (/#seccion): interceptados en fase de captura para que
  // el router no compita; usan Lenis cuando está activo.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a) return;
      const href = a.getAttribute("href") || "";
      const hashIdx = href.indexOf("#");
      if (hashIdx === -1) return;
      const path = href.slice(0, hashIdx);
      const hash = href.slice(hashIdx + 1);
      if (!hash || (path !== "" && path !== "/")) return; // links a otras páginas: navegación normal
      if (window.location.pathname !== "/") return; // fuera de la home, deja navegar y saltar
      const el = document.getElementById(hash);
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      const lenis = window.__lenis;
      if (lenis && !document.body.classList.contains("effects-off")) {
        lenis.scrollTo(el, { offset: -68, duration: 1.15 });
      } else {
        const y = el.getBoundingClientRect().top + window.scrollY - 68;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      history.replaceState(null, "", `${path || "/"}#${hash}`);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Easter egg del título de la pestaña (estilo OFF+BRAND)
  useEffect(() => {
    const original = document.title;
    const onVis = () => {
      if (document.hidden) {
        document.title = "👋 ¡Vuelve! Caskiuz te extraña";
      } else {
        document.title = original;
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.title = original;
    };
  }, []);

  return (
    <MotionConfig reducedMotion={fxOff ? "always" : "never"}>
      {/* Barra de progreso de scroll */}
      <motion.div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] z-[70] origin-left pointer-events-none"
        style={{
          scaleX: progress,
          background:
            "linear-gradient(90deg, var(--aff-blue-deep), var(--aff-blue) 40%, var(--aff-cyan) 75%, var(--metal-hi))",
        }}
      />

      {/* Fondo reactivo al mouse (toda la web) */}
      {!fxOff && <div className="fx-mouse-glow" aria-hidden />}

      {children}

      {!fxOff && <CursorFx />}
    </MotionConfig>
  );
}
