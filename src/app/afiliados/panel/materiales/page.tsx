import { requireAffiliate } from "@/lib/affiliate-auth";
import { affiliateRef } from "@/lib/affiliate";
import { MaterialsClient } from "@/components/affiliates/panel/materials-client";
import { SectionGuide } from "@/components/affiliates/panel/section-guide";

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
      <SectionGuide
        pageKey="materiales"
        title="Textos listos para copiar y pegar"
        intro="No necesitas escribir nada: cada texto ya trae tu link incluido. Elige tu red favorita y publica."
        steps={[
          "Elige la red donde vas a promocionar (abajo tienes accesos rápidos).",
          "Copia el texto con el botón «Copiar» — tu link viaja incluido.",
          "Publícalo tal cual o adáptalo a tu estilo.",
        ]}
        helpHref="/afiliados/panel/ayuda#materiales"
      />
      <MaterialsClient referralCode={affiliateRef(affiliate.slug, affiliate.referralCode)} />
    </div>
  );
}
