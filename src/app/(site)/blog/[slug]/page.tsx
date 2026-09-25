import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calendar, Clock } from "lucide-react";
import { notFound } from "next/navigation";
import { getBlogPost, getAllBlogSlugs } from "@/lib/blog-data";
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
          url: "/api/og",
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
      images: ["/api/og"],
    },
  };
}

export default async function BlogPost({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = getBlogPost(slug);

  if (!post) {
    notFound();
  }

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
    url: `${BASE_URL}/blog/${post.slug}`,
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
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium rounded-full bg-muted text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Content */}
          <div className="glass-card p-8">
            <div className="prose-custom whitespace-pre-wrap leading-relaxed">
              {post.content.split("\n").map((line, i) => {
                if (line.startsWith("# ")) {
                  return (
                    <h1
                      key={i}
                      className="text-3xl font-bold mt-10 mb-4 tracking-tight"
                    >
                      {line.slice(2)}
                    </h1>
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
                      {line.slice(2)}
                    </li>
                  );
                }
                if (line.startsWith("1. ") || line.match(/^\d+\./)) {
                  return (
                    <li key={i} className="ml-4 mb-1 text-muted-foreground">
                      {line.replace(/^\d+\.\s*/, "")}
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
                    {line}
                  </p>
                );
              })}
            </div>
          </div>

          {/* Share / nav */}
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