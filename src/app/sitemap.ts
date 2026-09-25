import { MetadataRoute } from "next";
import { getAllBlogSlugs } from "@/lib/blog-data";

const BASE_URL = "https://caskiuz.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/blog", "/afiliados", "/afiliados/faq", "/afiliados/terminos"].map(
    (route) => ({
      url: `${BASE_URL}${route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: route === "" ? 1 : route === "/afiliados" ? 0.9 : 0.7,
    })
  );

  const slugs = getAllBlogSlugs();

  const blogRoutes = slugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...blogRoutes];
}
