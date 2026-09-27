import { requireAffiliate } from "@/lib/affiliate-auth";
import { affiliateRef } from "@/lib/affiliate";
import { MaterialsClient } from "@/components/affiliates/panel/materials-client";

export default async function MaterialsPage() {
  const affiliate = await requireAffiliate();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Materiales promocionales</h1>
        <p className="text-muted-foreground mt-1">
          Copia, pega y comparte. Sin precios: tú generas el interés, Caskiuz cierra
          la venta.
        </p>
      </div>
      <MaterialsClient referralCode={affiliateRef(affiliate.slug, affiliate.referralCode)} />
    </div>
  );
}
