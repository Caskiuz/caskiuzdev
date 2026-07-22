import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { blogPosts } from "@/lib/blog-data";

export const metadata: Metadata = {
  title: "Blog | Caskiuz - Full-Stack Developer",
  description:
    "Artículos sobre desarrollo web, React, Next.js, Node.js, MySQL, arquitectura de software y vida freelance por Caskiuz.",
  alternates: {
    canonical: "https://caskiuz.vercel.app/blog",
  },
  openGraph: {
    title: "Blog | Caskiuz - Full-Stack Developer",
    description:
      "Artículos sobre desarrollo web, React, Next.js, Node.js, MySQL, arquitectura de software y vida freelance.",
    url: "https://caskiuz.vercel.app/blog",
    type: "website",
    siteName: "Caskiuz Portfolio",
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Caskiuz Blog - Artículos de desarrollo web",
      },
    ],
  },
};

export default function BlogPage() {
  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Blog
          </span>
          <h1 className="mt-3 text-4xl sm:text-5xl font-bold tracking-tight">
            Artículos y <span className="gradient-text">Recursos</span>
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Comparto mi experiencia, aprendizajes y mejores prácticas sobre
            desarrollo web, arquitectura de software y vida freelance.
          </p>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group glass-card p-6 hover:scale-[1.02] transition-all duration-300 flex flex-col"
            >
              <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(post.date).toLocaleDateString("es-ES", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {post.readTime}
                </span>
              </div>

              <h2 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-4">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 glass-card p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">
            ¿Te gusta el contenido?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Suscríbete para recibir nuevos artículos y recursos exclusivos
            directamente en tu bandeja de entrada.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="tu@email.com"
              className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary outline-none text-sm"
              required
            />
            <button
              type="submit"
              className="px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-lg shadow-primary/25"
            >
              Suscribirme
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}