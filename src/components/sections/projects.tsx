"use client";

import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { ExternalLink, Code2, ArrowUpRight, Star, GitFork, Loader2, Briefcase } from "lucide-react";
import Link from "next/link";
import { ProjectIcon } from "@/components/ui/project-icons";

const hardcodedDescriptions: Record<string, string> = {
  SistemadePrestamos:
    "Sistema web de gestión de préstamos desarrollado en Laravel 11. Optimizado para producción en Render con Docker, persistencia de sesiones seguras HTTPS, diseño adaptable mobile-first, lógica de reportes financieros multimoneda y middleware personalizado.",
  caskiuzdev:
    "Portfolio personal full-stack — Next.js 14, TailwindCSS, Prisma, Framer Motion. Desplegado en Vercel con CI/CD. Blog MDX, SEO optimizado, formulario de contacto y panel admin.",
  caskiuz:
    "Perfil de GitHub con README personalizado. Presentación profesional, estadísticas de actividad y proyectos destacados.",
};

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  size: number;
  updated_at: string;
}

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

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
        // Filtrar: quitar forks, repos vacíos (solo size 0 y sin descripción), ordenar por estrellas
        const filtered = data
          .filter((r) => !r.fork)
          .filter((r) => r.description || r.size > 0)
          .sort((a, b) => b.stargazers_count - a.stargazers_count);
        setRepos(filtered);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchRepos();
  }, []);

  // Primeros 2 como destacados (con más estrellas), el resto como side
  const mainProjects = repos.slice(0, 2);
  const sideProjects = repos.slice(2, 5);
  const hasMore = repos.length > 5;

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
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Portfolio
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            Proyectos <span className="gradient-text">Destacados</span>
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Una selección de mis repositorios públicos en GitHub, actualizados en tiempo real.
          </p>
        </motion.div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
                className="text-primary hover:underline font-medium"
              >
                Ver en GitHub →
              </a>
            </p>
          </div>
        )}

        {/* Bento Grid */}
        {!loading && !error && repos.length > 0 && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {/* Featured project 1 */}
            {mainProjects[0] && (
              <motion.div variants={itemVariants} className="group">
                <div className="relative h-full min-h-[340px] rounded-2xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 overflow-hidden p-6 flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* SVG Illustration */}
                  <div className="absolute top-2 right-2 w-36 h-36 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                    <ProjectIcon name={mainProjects[0].name} size={144} />
                  </div>

                  <div className="relative z-10">
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Destacado
                    </span>
                    <h3 className="text-xl font-bold mt-2 mb-3">
                      {mainProjects[0].name.replace(/-/g, " ")}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed max-w-lg">
                      {hardcodedDescriptions[mainProjects[0].name] || mainProjects[0].description || "Sin descripción"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {mainProjects[0].topics?.slice(0, 4).map((topic) => (
                        <span
                          key={topic}
                          className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                        >
                          {topic}
                        </span>
                      ))}
                      {mainProjects[0].language && (
                        <span className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${langColor(mainProjects[0].language)}`} />
                          {mainProjects[0].language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-3 mt-6">
                    <Link
                      href={mainProjects[0].html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
                    >
                      <Code2 className="w-4 h-4" />
                      Código
                    </Link>
                    {mainProjects[0].homepage && (
                      <Link
                        href={mainProjects[0].homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Demo
                      </Link>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Star className="w-3.5 h-3.5" />
                      {mainProjects[0].stargazers_count}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <GitFork className="w-3.5 h-3.5" />
                      {mainProjects[0].forks_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Featured project 2 */}
            {mainProjects[1] && (
              <motion.div variants={itemVariants} className="group">
                <div className="relative h-full min-h-[340px] rounded-2xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 overflow-hidden p-6 flex flex-col justify-between">
                  <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* SVG Illustration */}
                  <div className="absolute top-2 right-2 w-36 h-36 opacity-40 group-hover:opacity-60 transition-opacity duration-500 pointer-events-none">
                    <ProjectIcon name={mainProjects[1].name} size={144} />
                  </div>

                  <div className="relative z-10">
                    <span className="text-xs font-semibold text-secondary uppercase tracking-wider">
                      Destacado
                    </span>
                    <h3 className="text-xl font-bold mt-2 mb-3">
                      {mainProjects[1].name.replace(/-/g, " ")}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {hardcodedDescriptions[mainProjects[1].name] || mainProjects[1].description || "Sin descripción"}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {mainProjects[1].topics?.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                        >
                          {topic}
                        </span>
                      ))}
                      {mainProjects[1].language && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${langColor(mainProjects[1].language)}`} />
                          {mainProjects[1].language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-wrap items-center gap-2 mt-4">
                    <Link
                      href={mainProjects[1].html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-full transition-all"
                    >
                      <Code2 className="w-3 h-3" /> Código
                    </Link>
                    {mainProjects[1].homepage && (
                      <Link
                        href={mainProjects[1].homepage}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-primary hover:bg-primary-hover rounded-full transition-all"
                      >
                        Demo <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                    <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                      <Star className="w-3 h-3" /> {mainProjects[1].stargazers_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Side projects */}
            {sideProjects.map((project) => (
              <motion.div key={project.id} variants={itemVariants} className="group">
                <div className="relative h-full min-h-[200px] rounded-2xl border border-border bg-surface hover:bg-surface-hover transition-all duration-300 p-5 flex flex-col overflow-hidden">
                  {/* SVG Illustration */}
                  <div className="absolute top-1 right-1 w-28 h-28 opacity-25 group-hover:opacity-45 transition-opacity duration-500 pointer-events-none">
                    <ProjectIcon name={project.name} size={112} />
                  </div>

                  <div className="relative z-10 flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                      <Code2 className="w-5 h-5 text-primary" />
                    </div>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3" /> {project.stargazers_count}
                    </span>
                  </div>
                  <h3 className="font-bold mb-2 capitalize relative z-10">
                    {project.name.replace(/-/g, " ")}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed flex-1 relative z-10">
                    {hardcodedDescriptions[project.name] || project.description || "Sin descripción"}
                  </p>
                  <div className="relative z-10 flex flex-wrap gap-1.5 mt-4">
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
                  <Link
                    href={project.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 mt-3 text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Ver código <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
              </motion.div>
            ))}

            {/* LinkedIn Card */}
            <motion.div variants={itemVariants} className="group">
              <div className="relative h-full min-h-[200px] rounded-2xl border border-[#0A66C2]/30 bg-[#0A66C2]/[0.03] hover:bg-[#0A66C2]/[0.06] transition-all duration-300 p-5 flex flex-col">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#0A66C2]/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-[#0A66C2]" />
                  </div>
                </div>
                <h3 className="font-bold mb-2">LinkedIn</h3>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                  Conecta conmigo en LinkedIn. Experiencia profesional verificada, recomendaciones de clientes y habilidades validadas en desarrollo de software.
                </p>
                <Link
                  href="https://www.linkedin.com/in/ricardo-agelvis-9489a9370"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 text-xs text-[#0A66C2] hover:underline font-medium inline-flex items-center gap-1"
                >
                  Ver perfil <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* GitHub CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center mt-12"
        >
          {hasMore && (
            <p className="text-xs text-muted-foreground mb-4">
              Mostrando {Math.min(5, repos.length)} de {repos.length} repositorios
            </p>
          )}
          <Link
            href="https://github.com/Caskiuz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-surface border border-border hover:border-primary/30 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-primary/5"
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