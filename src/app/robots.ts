import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/", "/afiliados/panel/", "/afiliados/recuperar", "/afiliados/restablecer", "/r/"],
    },
    sitemap: "https://caskiuz.vercel.app/sitemap.xml",
  };
}
