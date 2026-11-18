import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { ThemeProvider } from "@/components/theme-provider";
import { JsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://caskiuz.vercel.app";

export const metadata: Metadata = {
  title: "Caskiuz | Full-Stack Developer & Software Architect",
  description:
    "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL. Construyo aplicaciones web y mobile que escalan tu negocio al siguiente nivel. ¡Contáctame por WhatsApp!",
  keywords: [
    "Caskiuz",
    "full-stack developer",
    "software architect",
    "React",
    "Next.js",
    "Node.js",
    "MySQL",
    "desarrollo web",
    "web development",
    "freelance",
    "desarrollador web",
    "programador",
    "portfolio",
  ],
  authors: [{ name: "Caskiuz" }],
  creator: "Caskiuz",
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  alternates: {
    canonical: BASE_URL,
  },
  // Verificación de Google Search Console: pegar el código en la env var
  // NEXT_PUBLIC_GSC_CODE (sin ella la web funciona igual).
  ...(process.env.NEXT_PUBLIC_GSC_CODE
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_CODE } }
    : {}),
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Caskiuz Portfolio",
    title: "Caskiuz | Full-Stack Developer & Software Architect",
    description:
      "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL. Construyo aplicaciones web y mobile que escalan tu negocio.",
    url: BASE_URL,
    images: [
      {
        url: "/api/og",
        width: 1200,
        height: 630,
        alt: "Caskiuz - Full-Stack Developer | React, Next.js, Node.js",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Caskiuz | Full-Stack Developer & Software Architect",
    description:
      "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL. Construyo aplicaciones web y mobile que escalan tu negocio.",
    images: ["/api/og"],
  },
  metadataBase: new URL(BASE_URL),
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";

/**
 * Layout raíz: solo provee el documento HTML, fuentes y tema.
 * El chrome del sitio público (header/footer) vive en (site)/layout.tsx
 * y el panel de afiliados/admin define su propio layout, de modo que
 * no se solapan el navbar público con los paneles internos.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6c5ce7" />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                name: "Caskiuz Portfolio",
                url: BASE_URL,
                description:
                  "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL.",
                inLanguage: "es",
              },
              {
                "@type": "Person",
                name: "Caskiuz",
                url: BASE_URL,
                jobTitle: "Full-Stack Developer & Software Architect",
                knowsAbout: [
                  "React",
                  "Next.js",
                  "Node.js",
                  "MySQL",
                  "TypeScript",
                  "TailwindCSS",
                ],
              },
            ],
          }}
        />
      </head>
      <body className="min-h-full">
        {/* Monitoreo (solo se activan con sus env vars — costo $0) */}
        {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
        {META_PIXEL_ID && (
          <Script id="meta-pixel" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');fbq('track', 'PageView');`}
          </Script>
        )}
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
