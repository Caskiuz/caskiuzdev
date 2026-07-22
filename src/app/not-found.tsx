import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "404 - Página no encontrada | Caskiuz",
  description: "La página que buscas no existe o ha sido movida.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center px-4">
        <span className="text-8xl font-bold gradient-text">404</span>
        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Página no encontrada
        </h1>
        <p className="mt-3 text-muted-foreground max-w-md mx-auto">
          La página que buscas no existe o ha sido movida a otra dirección.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all shadow-lg shadow-primary/25"
        >
          ← Volver al inicio
        </Link>
      </div>
    </div>
  );
}