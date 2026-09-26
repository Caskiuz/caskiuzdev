import { requireAffiliate } from "@/lib/affiliate-auth";
import { ProfileClient } from "@/components/affiliates/panel/profile-client";

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
