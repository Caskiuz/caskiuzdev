import { requireAffiliate } from "@/lib/affiliate-auth";
import { ProfileClient } from "@/components/affiliates/panel/profile-client";
import { SectionGuide } from "@/components/affiliates/panel/section-guide";

export default async function ProfilePage() {
  const affiliate = await requireAffiliate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">
          Administra tus datos personales y tu contraseña.
        </p>
      </div>
      <SectionGuide
        pageKey="perfil"
        title="Tu identidad en la red"
        intro="Estos datos te identifican ante el equipo y en tus pagos. Completa lo que falte."
        steps={[
          "Revisa que tu nombre, país y teléfono estén correctos.",
          "Personaliza tu link con tu nombre (ej: /r/tu-nombre).",
          "Sube una foto para tu cuenta.",
        ]}
        helpHref="/afiliados/panel/ayuda#panel"
      />
      <ProfileClient
        profile={{
          name: affiliate.name,
          email: affiliate.email,
          country: affiliate.country,
          phone: affiliate.phone,
          tier: affiliate.tier,
          referralCode: affiliate.referralCode,
          slug: affiliate.slug,
          emailVerified: affiliate.emailVerified,
          avatar: affiliate.avatar,
        }}
      />
    </div>
  );
}
