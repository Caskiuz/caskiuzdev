import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Crear cuenta de afiliado | Caskiuz Affiliates",
  description:
    "Regístrate gratis en la red de afiliados de Caskiuz y empieza a ganar comisiones de hasta 40% promocionando servicios digitales.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://caskiuz.vercel.app/afiliados/registro" },
};

export default function RegisterPage() {
  return (
    <div className="min-h-screen aff-glow flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/afiliados" className="inline-block">
            <span className="metal-text text-2xl font-bold tracking-tight">CASKIUZ AFFILIATES</span>
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Crea tu cuenta de afiliado</h1>
          <p className="mt-2 text-muted-foreground">
            Gratis · Sin cuotas · Pagos en USDT, USDC, BTC y Binance Pay
          </p>
        </div>
        <div className="metal-card rounded-2xl p-6 sm:p-8">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
