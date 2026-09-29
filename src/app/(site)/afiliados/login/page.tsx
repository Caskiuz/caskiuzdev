import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { AffiliateBrandHeader } from "@/components/affiliates/brand-header";
import { getCurrentAffiliate } from "@/lib/affiliate-auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Iniciar sesión | Caskiuz Affiliates",
  description:
    "Accede a tu panel de afiliado de Caskiuz: estadísticas, comisiones, enlaces y retiros en USDT, USDC, BTC y Binance Pay.",
  robots: { index: true, follow: true },
  alternates: { canonical: "https://caskiuz.vercel.app/afiliados/login" },
};

export default async function LoginPage() {
  const affiliate = await getCurrentAffiliate();
  const hasActiveSession = affiliate && affiliate.status !== "SUSPENDED";

  return (
    <div className="min-h-screen aff-glow flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AffiliateBrandHeader />
          <h1 className="mt-4 text-3xl font-bold">Bienvenido de nuevo</h1>
          <p className="mt-2 text-muted-foreground">Accede a tu panel de afiliado</p>
        </div>
        {hasActiveSession && affiliate && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/25 text-sm">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-foreground">
                Ya tienes sesión iniciada como {affiliate.name}
              </p>
              <p className="text-xs text-muted-foreground">
                Puedes ir directo a tu panel o cerrar sesión desde allí.
              </p>
            </div>
            <Link
              href="/afiliados/panel"
              className="btn-aff metal-shine inline-flex items-center gap-1.5 px-4 py-2 text-xs shrink-0"
            >
              Ir a mi panel <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
        <div className="metal-card rounded-2xl p-6 sm:p-8">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
