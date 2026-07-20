import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import { getSiteConfig } from "@/lib/site-config";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
  ],
  authors: [{ name: "Caskiuz" }],
  creator: "Caskiuz",
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    siteName: "Caskiuz Portfolio",
    title: "Caskiuz | Full-Stack Developer & Software Architect",
    description:
      "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL. Construyo aplicaciones web y mobile que escalan tu negocio.",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "Caskiuz Logo - Full-Stack Developer neon",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Caskiuz | Full-Stack Developer & Software Architect",
    description:
      "Full-Stack Developer especializado en React, Next.js, Node.js y MySQL. Construyo aplicaciones web y mobile que escalan tu negocio.",
    images: ["/logo.svg"],
  },
  metadataBase: new URL("https://caskiuz.dev"),
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