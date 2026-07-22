import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { getSiteConfig } from "@/lib/site-config";
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
  verification: {
    google: "REEMPLAZA_CON_TU_CODIGO_GOOGLE_SEARCH_CONSOLE",
  },
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getSiteConfig();
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
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: `${BASE_URL}/?s={search_term_string}`,
                  },
                  "query-input": "required name=search_term_string",
                },
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
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <Header />
          <main className="flex-1">{children}</main>
          <Footer config={config} />
          <WhatsAppButton config={config} />
        </ThemeProvider>
      </body>
    </html>
  );
}