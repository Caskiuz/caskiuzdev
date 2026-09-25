import type { Metadata } from "next";
import { AffiliateBrandHeader } from "@/components/affiliates/brand-header";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = {
  title: "Restablecer contraseña | Caskiuz Affiliates",
  description: "Establece una nueva contraseña para tu cuenta de afiliado.",
  robots: { index: false, follow: false },
};

export default function ResetPage() {
  return (
    <div className="min-h-screen aff-glow flex items-center justify-center px-4 py-28">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <AffiliateBrandHeader />
          <h1 className="mt-4 text-3xl font-bold">Nueva contraseña</h1>
        </div>
        <div className="metal-card rounded-2xl p-6 sm:p-8">
          <ResetForm />
        </div>
      </div>
    </div>
  );
}
