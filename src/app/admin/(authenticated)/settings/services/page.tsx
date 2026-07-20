import { getSiteConfig } from "@/lib/site-config";
import { ServicesEditor } from "./services-editor";

export const dynamic = "force-dynamic";

export default async function ServicesSettingsPage() {
  const config = await getSiteConfig();

  // Parse existing services or default to empty array
  let services: ServiceItem[] = [];
  try {
    const raw = config["services_data"];
    if (raw) services = JSON.parse(raw);
  } catch {
    // Default services structure
    services = [];
  }

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Editar <span className="gradient-text">Servicios</span>
        </h1>
        <p className="mt-2 text-muted-foreground">
          Agrega, edita o elimina los servicios que aparecen en la web. Los
          cambios se guardan automáticamente al hacer clic en Guardar.
        </p>
      </div>
      <ServicesEditor initialServices={services} />
    </div>
  );
}

export interface ServiceItem {
  id: string;
  title: string;
  description: string;
  price: string;
  category: string;
  features: string[];
  popular: boolean;
}