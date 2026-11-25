import { CanalesClient } from "./canales-client";

export const dynamic = "force-dynamic";

export default function CanalesPage() {
  return (
    <div className="p-6 sm:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Canales para <span className="gradient-text">enviar tu CV</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Dónde más postularte sin pagar nada: marketplaces freelance, bolsas de LatAm,
          bolsas remotas globales y empresas 100% remotas. Crea el perfil una vez y
          reutiliza el kit de postulación en cada formulario.
        </p>
      </div>
      <CanalesClient />
    </div>
  );
}
