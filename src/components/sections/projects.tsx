"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Code2, ArrowUpRight, Star, GitFork, Loader2, Smartphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { ProjectIcon } from "@/components/ui/project-icons";
import previewsJson from "@/lib/previews.json";

const hardcodedDescriptions: Record<string, string> = {
  SistemadePrestamos:
    "Sistema web de gestión de préstamos desarrollado en Laravel 11. Optimizado para producción en Render con Docker, persistencia de sesiones seguras HTTPS, diseño adaptable mobile-first, lógica de reportes financieros multimoneda y middleware personalizado.",
  caskiuzdev:
    "Portfolio personal full-stack — Next.js 16, TailwindCSS, Prisma, Framer Motion. Desplegado en Vercel con CI/CD. Blog MDX, SEO optimizado, formulario de contacto y panel admin.",
  caskiuz:
    "Perfil de GitHub con README personalizado. Presentación profesional, estadísticas de actividad y proyectos destacados.",
  rifasv2:
    "Plataforma SaaS de rifas en línea: cada organizador recibe una landing page con su logo y colores, más un panel de administración con estadísticas y verificador de tickets. Los participantes eligen sus números de lotería, suben el comprobante de pago y consultan sus tickets; los pagos van directo a la cuenta del organizador, sin comisiones.",
};

// Repos excluidos manualmente del portfolio (quitar el nombre de aquí para volver a mostrarlo).
// cobrogest-pro: su URL de Vercel devuelve 404 (deployment eliminado) — reactivar cuando tenga web activa.
const hiddenProjects = ["caskiuzdev", "dymb", "cobrogest-pro"];

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  demoUrl: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  size: number;
  updated_at: string;
  pushed_at: string;
}

/** Proyecto listo para renderizar, venga de GitHub o sea una entrada manual. */
interface ProjectData {
  id: string | number;
  name: string;
  description: string;
  demoUrl: string;
  codeUrl?: string;
  language: string | null;
  topics: string[];
  stars?: number;
  forks?: number;
  links?: { label: string; url: string }[];
  /** false = se muestra como tarjeta secundaria en vez de destacada (ej. proyectos en construcción) */
  featured?: boolean;
}

// Proyectos sin repositorio público: se muestran con los mismos enlaces que en sus webs.
const manualProjects: ProjectData[] = [
  {
    id: "comeya",
    name: "ComeYa",
    description:
      "App de delivery de comida con apps nativas para iOS y Android. Conecta restaurantes y negocios locales con sus clientes: menús con fotos reales, pedido en menos de un minuto, seguimiento del repartidor en tiempo real sobre el mapa, pago seguro y notificaciones en cada etapa. Incluye versión web sincronizada y panel de administración.",
    demoUrl: "https://comeya.es",
    language: null,
    topics: ["iOS", "Android", "Delivery"],
    links: [
      {
        label: "App Store",
        url: "https://apps.apple.com/ve/app/comeya/id6780499208",
      },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.comeya.app",
      },
    ],
  },
  {
    id: "beefinder",
    name: "BeeFinder",
    description:
      "Marketplace de servicios a domicilio donde los usuarios publican una tarea y los profesionales disponibles la realizan: limpieza, mudanzas, marketing digital, electrónica, salón y spa, entre otras categorías. Incluye perfiles de proveedores, reservas con pago desde la web o la app, valoraciones, panel de trabajos y apps nativas para iOS y Android.",
    demoUrl: "https://beefinder.net",
    language: null,
    topics: ["Marketplace", "Servicios", "iOS", "Android"],
    links: [
      {
        label: "App Store",
        url: "https://apps.apple.com/es/app/beefinder/id6766002889",
      },
      {
        label: "Google Play",
        url: "https://play.google.com/store/apps/details?id=com.beefinder.client&hl=en-US",
      },
    ],
  },
  {
    id: "highpower",
    name: "HighPower",
    description:
      "Plataforma Web3 y DeFi del ecosistema HighPower (HGP): staking, pools de liquidez y NFTs sobre BNB Smart Chain. Dashboard con métricas en vivo (TVL, usuarios, pools activos y NFTs acuñados), conexión de wallet y contratos inteligentes. Landing animada con diseño dark, orientada a tokens, NFTs y rendimientos sostenibles; desplegada en Vercel.",
    demoUrl: "https://highpowercoinproject.vercel.app",
    // Repo privado a la fecha: el botón "Código" dará 404 hasta que se haga público en GitHub.
    codeUrl: "https://github.com/Caskiuz/highpower-dapp-final",
    language: null,
    topics: ["Web3", "DeFi", "BNB Chain"],
  },
  {
    id: "astrobar",
    name: "AstroBar",
    description:
      "Plataforma de promociones nocturnas que conecta bares de Buenos Aires con sus clientes: los usuarios entran con verificación por SMS y descubren promos flash y ofertas exclusivas, con soporte por llamada y WhatsApp. Interfaz pensada como app de entregas local, con registro abierto para nuevos usuarios. Proyecto en construcción activa, ya desplegado en Vercel.",
    demoUrl: "https://astro-bar-app.vercel.app",
    language: null,
    topics: ["Bares", "Promociones", "Buenos Aires"],
    featured: false,
  },
];

function langColor(lang: string | null): string {
  const colors: Record<string, string> = {
    TypeScript: "bg-blue-500",
    JavaScript: "bg-yellow-400",
    Python: "bg-green-500",
    HTML: "bg-orange-500",
    CSS: "bg-purple-500",
    Java: "bg-red-600",
    "C++": "bg-rose-500",
  };
  return colors[lang || ""] || "bg-gray-500";
}

/** Captura del sitio en vivo vía /api/screenshot (Microlink, cacheada 24h). */
function screenshotUrl(url: string): string {
  return `/api/screenshot?url=${encodeURIComponent(url)}`;
}

interface PreviewEntry {
  video: string;
  poster: string;
  recordedAt: string;
}

const previews = previewsJson as Record<string, PreviewEntry>;

/** Vista previa grabada con `npm run previews`, si existe para esa URL. */
function recordedPreview(url: string): PreviewEntry | null {
  return previews[url.replace(/\/+$/, "")] ?? null;
}

// Una sola comprobación de incrustabilidad por URL y carga de página.
const embedChecks = new Map<string, Promise<boolean>>();

function isEmbeddable(url: string): Promise<boolean> {
  const cached = embedChecks.get(url);
  if (cached) return cached;
  const check = fetch(`/api/embed-check?url=${encodeURIComponent(url)}`)
    .then((res) => (res.ok ? res.json() : { embeddable: false }))
    .then((data) => Boolean(data.embeddable))
    .catch(() => false);
  embedChecks.set(url, check);
  return check;
}

/** Media query reactiva (arranca en false para no romper la hidratación). */
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);
  return matches;
}

const LIVE_WIDTH = 1280;
const LIVE_HEIGHT = 1400;
const HOVER_GRACE_MS = 1500;
const LIVE_LOAD_TIMEOUT_MS = 8000;

/** Escala del iframe al ancho de la tarjeta y recorrido vertical del paneo. */
function usePreviewGeometry(ref: RefObject<HTMLDivElement | null>) {
  const [geometry, setGeometry] = useState({ scale: 0.3, pan: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const scale = el.clientWidth / LIVE_WIDTH;
      setGeometry({
        scale,
        pan: Math.max(0, Math.round(LIVE_HEIGHT * scale - el.clientHeight)),
      });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return geometry;
}

type PreviewMode = "static" | "video" | "live";

/**
 * Miniatura de un proyecto con la animación real de su web: mini-ventana en vivo
 * (iframe) si el sitio permite incrustarse, o el vídeo grabado con `npm run previews`
 * si no lo permite (p. ej. BeeFinder) o si estamos en móvil.
 * Escritorio: arranca al pasar el ratón. Móvil: al entrar la tarjeta en pantalla.
 */
function ProjectPreview({ url, name }: { url: string; name: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const leaveTimer = useRef<number | undefined>(undefined);
  const hoverCapable = useMediaQuery("(hover: hover) and (pointer: fine)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [mode, setMode] = useState<PreviewMode>("static");
  const [active, setActive] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [liveReady, setLiveReady] = useState(false);
  const [liveFailed, setLiveFailed] = useState(false);
  const [videoBlocked, setVideoBlocked] = useState(false);
  const { scale, pan } = usePreviewGeometry(containerRef);

  const preview = recordedPreview(url);

  useEffect(() => {
    let cancelled = false;
    isEmbeddable(url).then((embeddable) => {
      if (cancelled) return;
      if (reducedMotion) {
        setMode("static");
      } else if (hoverCapable) {
        setMode(embeddable ? "live" : preview ? "video" : "static");
      } else {
        setMode(preview ? "video" : embeddable ? "live" : "static");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [url, hoverCapable, reducedMotion, preview]);

  // Vuelve al estado estático: desmonta el vídeo/iframe y reinicia su carga.
  const deactivate = () => {
    setActive(false);
    setLiveReady(false);
    setLiveFailed(false);
    setVideoBlocked(false);
  };

  // Móvil/táctil (sin hover): animación automática mientras la tarjeta se ve.
  useEffect(() => {
    if (hoverCapable || mode === "static") return;
    const el = containerRef.current;
    if (!el) return;
    let hideTimer: number | undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.5) {
          window.clearTimeout(hideTimer);
          setActive(true);
        } else if (entry.intersectionRatio <= 0.25) {
          hideTimer = window.setTimeout(deactivate, 400);
        }
      },
      { threshold: [0, 0.25, 0.5] }
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(hideTimer);
    };
  }, [hoverCapable, mode]);

  const playing = active && mode !== "static" && !videoBlocked;
  const live = playing && mode === "live" && liveReady && !liveFailed;
  const video = playing && mode === "video";
  const source = preview ? preview.poster : screenshotUrl(url);

  // El autoplay silenciado puede fallar (Modo de bajo consumo en iOS, por ejemplo).
  useEffect(() => {
    if (!video) return;
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch((error: DOMException) => {
      // AbortError = reproducción interrumpida por el desmontaje; no es un bloqueo.
      if (error?.name === "AbortError") return;
      setVideoBlocked(true);
    });
  }, [video]);

  // Si el iframe no termina de cargar, se queda la captura estática.
  useEffect(() => {
    if (!playing || mode !== "live" || liveReady) return;
    const timer = window.setTimeout(() => setLiveFailed(true), LIVE_LOAD_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [playing, mode, liveReady]);

  useEffect(() => () => window.clearTimeout(leaveTimer.current), []);

  const handleEnter = () => {
    if (!hoverCapable) return;
    window.clearTimeout(leaveTimer.current);
    setActive(true);
  };

  const handleLeave = () => {
    if (!hoverCapable) return;
    leaveTimer.current = window.setTimeout(deactivate, HOVER_GRACE_MS);
  };

  if (imageFailed && !live && !video) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="opacity-50">
          <ProjectIcon name={name} size={96} />
        </div>
      </div>
    );
  }

  const badge =
    "inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide text-white bg-black/60 rounded-full";

  return (
    <div
      ref={containerRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      className="absolute inset-0 overflow-hidden"
    >
      <Image
        src={source}
        alt={`Vista previa de ${name.replace(/-/g, " ")}`}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover object-top"
        loading="lazy"
        unoptimized
        onError={() => setImageFailed(true)}
      />

      {video && (
        <video
          ref={videoRef}
          src={preview?.video}
          poster={preview?.poster}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Mini-ventana en vivo: iframe 1280x1400 escalado al ancho de la tarjeta,
          paneando hacia abajo para que se vean las animaciones de la página. */}
      {playing && mode === "live" && !liveFailed && (
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="absolute left-0 top-0 w-full"
            style={
              {
                "--pan": `-${pan}px`,
                animation: liveReady ? "live-pan 18s ease-in-out infinite alternate" : "none",
              } as CSSProperties
            }
          >
            <div
              className="origin-top-left"
              style={{ width: LIVE_WIDTH, height: LIVE_HEIGHT, transform: `scale(${scale})` }}
            >
              <iframe
                src={url}
                title={`Sitio en vivo de ${name}`}
                loading="lazy"
                tabIndex={-1}
                aria-hidden="true"
                onLoad={() => setLiveReady(true)}
                onError={() => setLiveFailed(true)}
                className={`h-full w-full border-0 pointer-events-none transition-opacity duration-500 ${
                  liveReady ? "opacity-100" : "opacity-0"
                }`}
              />
            </div>
          </div>
        </div>
      )}

      {(live || video) && (
        <span
          className={`${badge} absolute top-3 right-3 z-20 text-[10px] px-2.5 py-1`}
        >
          <span className="relative flex w-1.5 h-1.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping" />
            <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-green-400" />
          </span>
          {live ? "En vivo" : "Vista previa"}
        </span>
      )}

      {/* Mientras corre la animación el overlay "Ver" se reduce a una etiqueta
          para no taparla; la tarjeta completa sigue abriendo el sitio. */}
      {live || video ? (
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-1.5 text-xs font-medium text-white bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
          Ver sitio <ArrowUpRight className="w-3 h-3" />
        </span>
      ) : (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="flex items-center gap-1.5 text-xs font-medium text-white bg-black/50 px-3 py-1.5 rounded-full">
            Ver <ArrowUpRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </div>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const openDemo = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

function FeaturedCard({ project }: { project: ProjectData }) {
  return (
    <motion.div variants={itemVariants} className="group">
      <div
        onClick={() => openDemo(project.demoUrl)}
        className="relative h-full rounded-2xl metal-card transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* Miniatura con vista previa animada del sitio */}
        <div className="relative h-52 shrink-0 overflow-hidden bg-surface">
          <ProjectPreview url={project.demoUrl} name={project.name} />
          <span className="absolute top-3 left-3 z-30 text-xs font-semibold text-white bg-gradient-to-r from-aff-blue to-aff-cyan px-3 py-1 rounded-full">
            Destacado
          </span>
        </div>

        <div className="relative z-10 p-6 flex flex-col flex-1">
          <h3 className="text-xl font-bold mb-3">{project.name.replace(/-/g, " ")}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{project.description}</p>
          <div className="flex flex-wrap gap-2 mt-4">
            {project.topics?.slice(0, 4).map((topic) => (
              <span
                key={topic}
                className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground"
              >
                {topic}
              </span>
            ))}
            {project.language && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                <span className={`w-2 h-2 rounded-full ${langColor(project.language)}`} />
                {project.language}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-auto pt-6">
            {project.codeUrl && (
              <Link
                href={project.codeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
              >
                <Code2 className="w-4 h-4" />
                Código
              </Link>
            )}
            {project.links?.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
              >
                <Smartphone className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
            <Link
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium btn-aff transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Ver
            </Link>
            {project.stars !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                <Star className="w-3.5 h-3.5" />
                {project.stars}
              </span>
            )}
            {project.forks !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GitFork className="w-3.5 h-3.5" />
                {project.forks}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SideCard({ project }: { project: ProjectData }) {
  return (
    <motion.div variants={itemVariants} className="group">
      <div
        onClick={() => openDemo(project.demoUrl)}
        className="relative h-full rounded-2xl metal-card transition-all duration-300 overflow-hidden flex flex-col cursor-pointer"
      >
        {/* Miniatura con vista previa animada del sitio */}
        <div className="relative aspect-video shrink-0 overflow-hidden bg-surface">
          <ProjectPreview url={project.demoUrl} name={project.name} />
        </div>

        <div className="relative z-10 p-5 flex flex-col flex-1">
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-bold capitalize">{project.name.replace(/-/g, " ")}</h3>
            {project.stars !== undefined && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
                <Star className="w-3 h-3" /> {project.stars}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{project.description}</p>
          <div className="flex flex-wrap gap-1.5 mt-4">
            {project.language && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground">
                <span className={`w-1.5 h-1.5 rounded-full ${langColor(project.language)}`} />
                {project.language}
              </span>
            )}
            {project.topics?.slice(0, 2).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
              >
                {topic}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {project.codeUrl && (
              <Link
                href={project.codeUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
              >
                <Code2 className="w-3 h-3" />
                Código
              </Link>
            )}
            {project.links?.map((link) => (
              <Link
                key={link.url}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
              >
                <Smartphone className="w-3 h-3" />
                {link.label}
              </Link>
            ))}
            <Link
              href={project.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium btn-aff transition-all"
            >
              Ver <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const byStars = (a: GitHubRepo, b: GitHubRepo) => b.stargazers_count - a.stargazers_count;
const byRecent = (a: GitHubRepo, b: GitHubRepo) =>
  new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime();

export function Projects() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchRepos() {
      try {
        const res = await fetch("/api/github");
        if (!res.ok) throw new Error("GitHub API error");
        const data: GitHubRepo[] = await res.json();
        // Solo repos con demo en vivo (Vercel o campo "Website" de GitHub)
        const live = data
          .filter((r) => !r.fork)
          .filter((r) => !hiddenProjects.includes(r.name))
          .filter((r) => r.description || r.size > 0)
          .filter((r) => Boolean(r.demoUrl));
        setRepos(live);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  const toProjectData = (repo: GitHubRepo): ProjectData => ({
    id: repo.id,
    name: repo.name,
    description: hardcodedDescriptions[repo.name] || repo.description || "Sin descripción",
    demoUrl: repo.demoUrl!,
    codeUrl: repo.html_url,
    language: repo.language,
    topics: repo.topics ?? [],
    stars: repo.stargazers_count,
    forks: repo.forks_count,
  });

  // Destacados: manuales sin "featured: false" primero, luego los 2 repos con más estrellas.
  // El resto va a la grilla secundaria: repos por más reciente + manuales no destacados.
  const featuredGb = useMemo(() => [...repos].sort(byStars).slice(0, 2).map(toProjectData), [repos]);
  const sideGb = useMemo(() => {
    const featuredIds = new Set(featuredGb.map((p) => p.id));
    return repos.filter((r) => !featuredIds.has(r.id)).sort(byRecent).map(toProjectData);
  }, [repos, featuredGb]);
  const featured = useMemo(
    () => [...manualProjects.filter((p) => p.featured !== false), ...featuredGb],
    [featuredGb]
  );
  const sideProjects = useMemo(
    () => [...sideGb, ...manualProjects.filter((p) => p.featured === false)],
    [sideGb]
  );
  const totalProjects = featured.length + sideProjects.length;

  return (
    <section ref={ref} id="projects" className="relative py-24 sm:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-aff-cyan uppercase tracking-wider">
            Portfolio
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Proyectos <span className="metal-text">en Vivo</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Mis proyectos en vivo, sincronizados en tiempo real con GitHub y Vercel.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-aff-cyan" />
            <span className="ml-3 text-muted-foreground">Cargando proyectos desde GitHub...</span>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              No se pudieron cargar los proyectos.{" "}
              <a
                href="https://github.com/Caskiuz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aff-cyan hover:underline font-medium"
              >
                Ver en GitHub →
              </a>
            </p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && totalProjects === 0 && (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Aún no hay proyectos en vivo.{" "}
              <a
                href="https://github.com/Caskiuz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-aff-cyan hover:underline font-medium"
              >
                Ver repositorios en GitHub →
              </a>
            </p>
          </div>
        )}

        {/* Bento Grid */}
        {!loading && !error && totalProjects > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {featured.map((project) => (
              <FeaturedCard key={project.id} project={project} />
            ))}

            {sideProjects.map((project) => (
              <SideCard key={project.id} project={project} />
            ))}
          </motion.div>
        )}

        {/* GitHub CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          {totalProjects > 0 && (
            <p className="text-xs text-muted-foreground mb-4">
              Mostrando {totalProjects} {totalProjects === 1 ? "proyecto" : "proyectos"} en vivo
            </p>
          )}
          <Link
            href="https://github.com/Caskiuz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground glass-card hover:border-aff-cyan/30 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-aff-cyan/5"
          >
            <Code2 className="w-4 h-4" />
            Ver todos los proyectos en GitHub
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
