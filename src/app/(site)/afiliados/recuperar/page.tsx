import type { Metadata } from "next";
import { AffiliateBrandHeader } from "@/components/affiliates/brand-header";
import { ForgotForm } from "./forgot-form";

export const metadata: Metadata = {
  title: "Recuperar contraseña | Caskiuz Affiliates",
  description: "Recupera el acceso a tu cuenta de afiliado de Caskiuz.",
  robots: { index: false, follow: false },
};

export default function ForgotPage() {
  return (
    <div className="min-h-screen aff-glow flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AffiliateBrandHeader />
          <h1 className="mt-4 text-3xl font-bold">Recuperar contraseña</h1>
          <p className="mt-2 text-muted-foreground">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>
        <div className="metal-card rounded-2xl p-6 sm:p-8">
          <ForgotForm />
        </div>
      </div>
    </div>
  );
}
