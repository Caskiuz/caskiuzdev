import type { Metadata } from "next";
import { AffiliateBrandHeader } from "@/components/affiliates/brand-header";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Caskiuz Affiliates",
  description:
    "Accede a tu panel de afiliado de Caskiuz: estadísticas, comisiones, enlaces y retiros en USDT, USDC, BTC y Binance Pay.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://caskiuz.vercel.app/afiliados/login" },
};

export default function LoginPage() {
  return (
    <div className="min-h-screen aff-glow flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AffiliateBrandHeader />
          <h1 className="mt-4 text-3xl font-bold">Bienvenido de nuevo</h1>
          <p className="mt-2 text-muted-foreground">Accede a tu panel de afiliado</p>
        </div>
        <div className="metal-card rounded-2xl p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
