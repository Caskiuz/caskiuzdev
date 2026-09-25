import Link from "next/link";
import { BrandLogo } from "@/components/ui/brand-logo";

/** Marca de la red de afiliados: logo 3D + wordmark cromado */
export function AffiliateBrandHeader() {
  return (
    <Link href="/afiliados" className="inline-flex flex-col items-center gap-3 group">
      <BrandLogo size={54} />
      <span className="metal-text text-2xl font-bold tracking-tight">CASKIUZ AFFILIATES</span>
    </Link>
  );
}
