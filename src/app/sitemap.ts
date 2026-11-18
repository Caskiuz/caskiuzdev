import { MetadataRoute } from "next";
import { getAllBlogSlugs, getBlogPost } from "@/lib/blog-data";

const BASE_URL = "https://caskiuz.vercel.app";
const SITE_DEPLOY_DATE = new Date("2026-11-18"); // última actualización estructural

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/blog",
    "/recursos",
    "/afiliados",
    "/afiliados/faq",
    "/afiliados/terminos",
    "/afiliados/registro",
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: SITE_DEPLOY_DATE,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : route === "/afiliados" ? 0.9 : route === "/recursos" ? 0.8 : 0.7,
  }));

  // Landings de servicio (SEO por keyword)
  const serviceLandings = [
    "desarrollo-web",
    "automatizacion-ia",
    "redes-sociales",
  ].map((slug) => ({
    url: `${BASE_URL}/servicios/${slug}`,
    lastModified: SITE_DEPLOY_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.85,
  }));

  const blogRoutes = getAllBlogSlugs().map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: getBlogPost(slug)?.date ? new Date(getBlogPost(slug)!.date) : SITE_DEPLOY_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...serviceLandings, ...blogRoutes];
}
