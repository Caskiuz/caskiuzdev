import type { Metadata } from "next";
import { isAuthenticated } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = {
  title: "Admin | Caskiuz",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  // Verificación real del servidor: si ya hay sesión, se muestra el acceso
  // directo al panel en lugar del formulario.
  const authenticated = await isAuthenticated();

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="glass-card p-8">
          <AdminLoginForm alreadyAuthenticated={authenticated} />
        </div>
      </div>
    </div>
  );
}
