import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock, Share2, Link2 } from "lucide-react";
import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogSlugs, blogCoverUrl, blogPosts } from "@/lib/blog-data";
import { JsonLd } from "@/components/seo/json-ld";

const BASE_URL = "https://caskiuz.vercel.app";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllBlogSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    return { title: "Post no encontrado | Caskiuz" };
  }

  const description = post.excerpt;
  const ogImage = `/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(
    post.tags.slice(0, 3).join(" · ") || "Blog de Caskiuz"
  )}`;

  return {
    title: `${post.title} | Caskiuz Blog`,
    description,
    alternates: {
      canonical: `${BASE_URL}/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description,
      url: `${BASE_URL}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.date,
      tags: post.tags,
      siteName: "Caskiuz Portfolio",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      authors: ["Caskiuz"],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [ogImage],
    },
  };
}

/** Render inline de texto con **negritas** y [enlaces](url) — enlaza el contenido con servicios y otros posts. */
function InlineText({ text }: { text: string }) {
  // Dividir por enlaces y negritas manteniendo los delimitadores
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = /\[([^\]]+)\]\(([^)]+)\)/.exec(part);
        if (link) {
          const href = link[2].startsWith("http") ? link[2] : link[2];
          return (
            <Link
              key={i}
              href={href}
              className="text-aff-cyan hover:underline font-medium"
            >
              {link[1]}
            </Link>
          );
        }
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="text-foreground font-semibold">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default async function BlogPost({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

  // Posts relacionados: mayor solape de tags, excluyendo el actual
  const related = blogPosts
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ post: p, overlap: p.tags.filter((t) => post.tags.includes(t)).length }))
    .filter((r) => r.overlap > 0)
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, 2)
    .map((r) => r.post);

  const shareUrl = `${BASE_URL}/blog/${post.slug}`;
  const shareLinks = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${shareUrl}`)}`,
    },
    {
      label: "X",
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "LinkedIn",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.title)}`,
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Person",
      name: "Caskiuz",
      url: BASE_URL,
    },
    publisher: {
      "@type": "Person",
      name: "Caskiuz",
    },
    url: shareUrl,
    keywords: post.tags.join(", "),
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <article className="min-h-screen pt-24 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* BreadcrumbList JSON-LD */}
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Inicio",
                  item: BASE_URL,
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Blog",
                  item: `${BASE_URL}/blog`,
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: post.title,
                },
              ],
            }}
          />

          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al blog
          </Link>

          {/* Portada generada con IA (determinística por post) */}
          <div className="mb-8 overflow-hidden rounded-2xl border border-border">
            <Image
              src={blogCoverUrl(post)}
              alt={`Portada: ${post.title}`}
              width={1200}
              height={630}
              priority
              className="w-full h-auto object-cover"
            />
          </div>

          {/* Header */}
          <header className="mb-10">
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                {new Date(post.date).toLocaleDateString("es-ES", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                {post.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
              {post.title}
            </h1>

            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog?tag=${encodeURIComponent(tag)}`}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-aff-cyan/10 hover:text-aff-cyan transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </header>

          {/* Content */}
          <div className="glass-card p-8">
            <div className="prose-custom whitespace-pre-wrap leading-relaxed">
              {post.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  // El título del post ya es el h1: el contenido usa h2
                  return (
                    <h2
                      key={i}
                      className="text-2xl font-bold mt-8 mb-4 tracking-tight"
                    >
                      {line.slice(2)}
                    </h2>
                  );
                }
                if (line.startsWith("## ")) {
                  return (
                    <h2
                      key={i}
                      className="text-2xl font-bold mt-8 mb-3 tracking-tight"
                    >
                      {line.slice(3)}
                    </h2>
                  );
                }
                if (line.startsWith("### ")) {
                  return (
                    <h3
                      key={i}
                      className="text-xl font-semibold mt-6 mb-2"
                    >
                      {line.slice(4)}
                    </h3>
                  );
                }
                if (line.startsWith("- **")) {
                  const cleaned = line
                    .slice(2)
                    .replace(/\*\*/g, "")
                    .replace(/: /, ": ");
                  const [label, ...rest] = cleaned.split(": ");
                  return (
                    <li key={i} className="ml-4 mb-1 text-muted-foreground">
                      <strong className="text-foreground">{label}</strong>:{" "}
                      {rest.join(": ")}
                    </li>
                  );
                }
                if (line.startsWith("- ")) {
                  return (
                    <li key={i} className="ml-4 mb-1 text-muted-foreground">
                      <InlineText text={line.slice(2)} />
                    </li>
                  );
                }
                if (line.startsWith("1. ") || line.match(/^\d+\./)) {
                  return (
                    <li key={i} className="ml-4 mb-1 text-muted-foreground">
                      <InlineText text={line.replace(/^\d+\.\s*/, "")} />
                    </li>
                  );
                }
                if (line.startsWith("```")) {
                  return (
                    <div
                      key={i}
                      className="my-2 px-3 py-1 bg-muted rounded text-xs text-muted-foreground font-mono"
                    >
                      {line.slice(3)}
                    </div>
                  );
                }
                if (line.startsWith("`") && line.endsWith("`")) {
                  return (
                    <code
                      key={i}
                      className="px-1.5 py-0.5 rounded-md bg-muted text-sm font-mono text-accent"
                    >
                      {line.slice(1, -1)}
                    </code>
                  );
                }
                if (line === "") {
                  return <br key={i} />;
                }
                return (
                  <p key={i} className="mb-4 leading-relaxed text-muted-foreground">
                    <InlineText text={line} />
                  </p>
                );
              })}
            </div>
          </div>

          {/* CTA de conversión — el blog alimenta el pipeline */}
          <div className="mt-10 relative overflow-hidden rounded-2xl bg-gradient-to-r from-aff-blue/10 via-aff-blue/5 to-aff-cyan/10 border border-aff-blue/20 p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">
              ¿Necesitas una web o automatización para tu negocio?
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Webs desde <span className="text-aff-cyan font-semibold">$149 USD</span> ·
              Chatbots de WhatsApp desde <span className="text-aff-cyan font-semibold">$199</span> ·
              Propuesta preliminar con IA en minutos.
            </p>
            <Link
              href="/#contact"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold btn-aff rounded-xl"
            >
              Cotizar en 3 pasos →
            </Link>
            <p className="text-xs text-muted-foreground mt-3">
              ¿Tienes audiencia?{" "}
              <Link href="/afiliados" className="text-aff-cyan hover:underline">
                Gana hasta 40% de comisión recomendando estos servicios →
              </Link>
            </p>
          </div>

          {/* Posts relacionados */}
          {related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Link2 className="w-4 h-4 text-aff-cyan" /> Sigue leyendo
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/blog/${r.slug}`}
                    className="glass-card p-4 hover:scale-[1.02] transition-transform group"
                  >
                    <p className="text-[11px] text-muted-foreground mb-1">
                      {new Date(r.date).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                      })}{" "}
                      · {r.readTime}
                    </p>
                    <p className="text-sm font-semibold group-hover:text-aff-cyan transition-colors leading-snug">
                      {r.title}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Compartir */}
          <div className="mt-10">
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-2">
              <Share2 className="w-3.5 h-3.5" /> Comparte este artículo
            </p>
            <div className="flex flex-wrap gap-2">
              {shareLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-aff-cyan hover:border-aff-cyan/40 transition-colors"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div className="mt-10 text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-foreground bg-surface border border-border hover:border-primary/30 rounded-full transition-all"
            >
              ← Más artículos
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
