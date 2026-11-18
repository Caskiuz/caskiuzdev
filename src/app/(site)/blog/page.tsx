import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Calendar, Clock, Users } from "lucide-react";
import { blogPosts, blogCoverUrl } from "@/lib/blog-data";
import { SubscribeForm } from "@/components/blog/subscribe-form";

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
        url: "/api/og?title=Blog%20de%20desarrollo%20web&subtitle=React%20%C2%B7%20Next.js%20%C2%B7%20Node.js%20%C2%B7%20Freelancing",
        width: 1200,
        height: 630,
        alt: "Caskiuz Blog - Artículos de desarrollo web",
      },
    ],
  },
};

interface BlogPageProps {
  searchParams: Promise<{ tag?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { tag } = await searchParams;
  const activeTag = tag?.trim();
  const allTags = [...new Set(blogPosts.flatMap((p) => p.tags))];
  const posts = activeTag
    ? blogPosts.filter((p) => p.tags.includes(activeTag))
    : blogPosts;

  return (
    <div className="min-h-screen pt-24 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
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

        {/* Filtro por tags — enlaza contenido (SEO interno) */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          <Link
            href="/blog"
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              !activeTag
                ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Todos ({blogPosts.length})
          </Link>
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeTag === t
                  ? "border-aff-cyan bg-aff-cyan/10 text-aff-cyan"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              #{t}
            </Link>
          ))}
        </div>

        {posts.length === 0 ? (
          <p className="text-center text-muted-foreground py-16">
            No hay artículos con el tag «{activeTag}» todavía.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group glass-card spotlight-card p-6 hover:scale-[1.02] transition-all duration-300 flex flex-col"
              >
                {/* Portada generada con IA (determinística por post) */}
                <div className="relative -mx-2 sm:-mx-3 -mt-2 sm:-mt-3 mb-4 overflow-hidden rounded-xl">
                  <Image
                    src={blogCoverUrl(post)}
                    alt={`Portada: ${post.title}`}
                    width={1200}
                    height={630}
                    loading="lazy"
                    className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
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
                    {post.tags.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-muted text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Programa de afiliados — canal de crecimiento */}
        <div className="mt-14 relative overflow-hidden rounded-2xl border border-aff-cyan/20 bg-aff-cyan/5 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-4">
          <Users className="w-8 h-8 text-aff-cyan shrink-0" />
          <div className="flex-1 text-center sm:text-left">
            <h3 className="text-lg font-bold">¿Tienes audiencia? Monetízala con nosotros</h3>
            <p className="text-sm text-muted-foreground">
              Gana hasta <span className="text-aff-cyan font-semibold">40% de comisión</span>{" "}
              recomendando mis servicios. Gratis, con panel y pagos en cripto, PayPal o bancos locales.
            </p>
          </div>
          <Link
            href="/afiliados"
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-full border border-aff-cyan/40 text-aff-cyan hover:bg-aff-cyan/10 transition-colors shrink-0"
          >
            Ver programa →
          </Link>
        </div>

        {/* Newsletter CTA */}
        <div className="mt-8 glass-card p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">
            ¿Te gusta el contenido?
          </h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Un correo al mes: artículos nuevos, ofertas reales de servicios y
            recursos para hacer crecer tu negocio con IA.
          </p>
          <SubscribeForm />
        </div>
      </div>
    </div>
  );
}
