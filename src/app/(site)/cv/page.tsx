import type { Metadata } from "next";
import Link from "next/link";
import {
  MapPin,
  CheckCircle2,
  Download,
  MessageCircle,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Languages,
} from "lucide-react";
import { candidateProfile } from "@/lib/candidate-profile";
import { getSiteConfig } from "@/lib/site-config";
import { JsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://caskiuz.vercel.app";

export const metadata: Metadata = {
  title: `${candidateProfile.displayName} — CV | Full-Stack & Automatización IA`,
  description:
    "CV de Ricardo Agelvis (Caskiuz): Desarrollador Full-Stack con 6+ años de experiencia en Next.js, Node.js y Python, especializado en automatización con IA. Disponible para trabajo remoto.",
  keywords: [
    "Ricardo Agelvis CV",
    "desarrollador full-stack remoto",
    "next.js developer venezuela",
    "automatización IA",
    "contratar desarrollador web",
  ],
  alternates: { canonical: `${BASE_URL}/cv` },
  openGraph: {
    title: `${candidateProfile.displayName} — CV`,
    description: candidateProfile.headline,
    url: `${BASE_URL}/cv`,
    siteName: "Caskiuz Portfolio",
    images: [
      {
        url: `/api/og?title=${encodeURIComponent("Ricardo Agelvis — CV")}&subtitle=${encodeURIComponent("Full-Stack · Next.js · Node.js · Python · Automatización IA")}`,
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default async function CvPage() {
  const config = await getSiteConfig();
  const openToWork = config.open_to_work !== "0";
  const whatsapp = (config.contact_whatsapp || "584262931869").replace(/\D/g, "");

  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: candidateProfile.name,
    alternateName: "Caskiuz",
    jobTitle: "Desarrollador Full-Stack & Automatización IA",
    url: BASE_URL,
    sameAs: [
      candidateProfile.links.github,
      candidateProfile.links.linkedin,
      candidateProfile.links.torre,
    ],
    address: { "@type": "PostalAddress", addressCountry: "VE", addressRegion: "Táchira" },
    knowsAbout: [...candidateProfile.skills],
    ...(openToWork
      ? {
          seeks: {
            "@type": "Demand",
            name: "Trabajo remoto full-stack / automatización IA",
          },
        }
      : {}),
    worksFor: { "@type": "Organization", name: "Caskiuz (Freelance)" },
  };

  return (
    <div className="min-h-screen pt-24 pb-24 aff-glow">
      <JsonLd data={personSchema} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabecera */}
        <div className="glass-card spotlight-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-6">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {candidateProfile.displayName}
                </h1>
                {openToWork && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/30">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Disponible para trabajo remoto
                  </span>
                )}
              </div>
              <p className="text-aff-cyan font-semibold">{candidateProfile.headline}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                <MapPin className="w-3.5 h-3.5" /> {candidateProfile.location}
              </p>
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed max-w-2xl">
                {candidateProfile.summary}
              </p>
              <div className="flex flex-wrap gap-2 mt-5">
                <a
                  href="/images/cv-caskiuz.pdf"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold btn-aff rounded-xl"
                >
                  <Download className="w-4 h-4" /> Descargar CV (PDF)
                </a>
                <a
                  href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Hola Ricardo! Vi tu CV en caskiuz.vercel.app y quiero conversar sobre una oportunidad.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] rounded-xl transition-colors"
                >
                  <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                </a>
                <a
                  href={candidateProfile.links.torre}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
                >
                  Perfil en Torre ↗
                </a>
                <a
                  href={candidateProfile.links.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
                >
                  LinkedIn ↗
                </a>
                <a
                  href={candidateProfile.links.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
                >
                  GitHub ↗
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Habilidades */}
        <div className="glass-card spotlight-card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-4">Habilidades</h2>
          <div className="flex flex-wrap gap-2">
            {candidateProfile.skills.map((s) => (
              <span
                key={s}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-surface border border-border text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            <Languages className="w-4 h-4 text-aff-cyan" /> {candidateProfile.languages.join(" · ")}
          </p>
        </div>

        {/* Experiencia */}
        <div className="glass-card spotlight-card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-aff-cyan" /> Experiencia
          </h2>
          <div className="space-y-5">
            {candidateProfile.experience.map((e) => (
              <div key={`${e.company}-${e.period}`} className="border-l-2 border-aff-cyan/30 pl-4">
                <p className="text-xs text-aff-cyan font-semibold">{e.period}</p>
                <h3 className="font-bold">{e.title}</h3>
                <p className="text-sm text-muted-foreground">{e.company}</p>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{e.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Proyectos */}
        <div className="glass-card spotlight-card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-aff-cyan" /> Proyectos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {candidateProfile.projects.map((p) => (
              <a
                key={p.url}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-4 rounded-xl bg-surface border border-border hover:border-aff-cyan/40 transition-colors"
              >
                <p className="text-sm font-bold group-hover:text-aff-cyan transition-colors">{p.name} ↗</p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Educación */}
        <div className="glass-card spotlight-card p-6 sm:p-8 mb-6">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-aff-cyan" /> Educación
          </h2>
          <div className="space-y-3">
            {candidateProfile.education.map((e) => (
              <div key={e.title} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <div>
                  <p className="text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted-foreground">{e.institution}</p>
                </div>
                <span className="text-xs text-muted-foreground">{e.period}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            ¿Buscas un full-stack que además automatiza procesos con IA?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4" /> Hablar conmigo
            </Link>
            <Link
              href="/recursos"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-xl border border-border hover:bg-surface-hover transition-colors"
            >
              Recursos gratis →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
