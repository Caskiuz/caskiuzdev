"use client";

import { useState } from "react";
import { Save, Plus, Trash2, CheckCircle2, AlertCircle, Loader2, GripVertical, X, Star } from "lucide-react";
import type { ServiceItem } from "./page";

const CATEGORIES = [
  { key: "desarrollo", label: "🏗️ Desarrollo" },
  { key: "producto", label: "🚀 Producto" },
  { key: "consultoria", label: "🔧 Consultoría" },
];

function createEmptyService(): ServiceItem {
  return {
    id: crypto.randomUUID(),
    title: "",
    description: "",
    price: "",
    category: "desarrollo",
    features: [""],
    popular: false,
  };
}

interface Props {
  initialServices: ServiceItem[];
}

export function ServicesEditor({ initialServices }: Props) {
  const [services, setServices] = useState<ServiceItem[]>(
    initialServices.length > 0 ? initialServices : []
  );
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const addService = () => {
    setServices((prev) => [...prev, createEmptyService()]);
  };

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((s) => s.id !== id));
  };

  const updateService = (id: string, field: keyof ServiceItem, value: unknown) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [field]: value } : s))
    );
  };

  const addFeature = (serviceId: string) => {
    setServices((prev) =>
      prev.map((s) =>
        s.id === serviceId ? { ...s, features: [...s.features, ""] } : s
      )
    );
  };

  const updateFeature = (serviceId: string, index: number, value: string) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        const features = [...s.features];
        features[index] = value;
        return { ...s, features };
      })
    );
  };

  const removeFeature = (serviceId: string, index: number) => {
    setServices((prev) =>
      prev.map((s) => {
        if (s.id !== serviceId) return s;
        return { ...s, features: s.features.filter((_, i) => i !== index) };
      })
    );
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          configs: [
            { key: "services_data", value: JSON.stringify(services), group: "services" },
            { key: "services_label", value: "Servicios", group: "services" },
            { key: "services_title", value: "Lo que puedo hacer por ti", group: "services" },
            { key: "services_subtitle", value: "Soluciones a medida para cada etapa de tu producto digital...", group: "services" },
          ],
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Error al guardar");
      }

      setStatus("success");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {services.map((service, idx) => (
        <div key={service.id} className="glass-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-sm">
                Servicio #{idx + 1}
              </span>
              <button
                onClick={() => updateService(service.id, "popular", !service.popular)}
                className={`p-1.5 rounded-lg transition-colors ${
                  service.popular
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
                title={service.popular ? "Quitar 'Más Popular'" : "Marcar como 'Más Popular'"}
              >
                <Star
                  className={`w-4 h-4 ${service.popular ? "fill-primary" : ""}`}
                />
              </button>
            </div>
            <button
              onClick={() => removeService(service.id)}
              className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              title="Eliminar servicio"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1.5">Título</label>
              <input
                value={service.title}
                onChange={(e) => updateService(service.id, "title", e.target.value)}
                placeholder="Web Apps"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Precio</label>
              <input
                value={service.price}
                onChange={(e) => updateService(service.id, "price", e.target.value)}
                placeholder="Desde $800 USD"
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1.5">Descripción</label>
              <textarea
                value={service.description}
                onChange={(e) => updateService(service.id, "description", e.target.value)}
                rows={2}
                placeholder="Aplicaciones web full-stack..."
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1.5">Categoría</label>
              <select
                value={service.category}
                onChange={(e) => updateService(service.id, "category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Features */}
          <div className="mt-4">
            <label className="block text-xs font-medium mb-2">Características</label>
            <div className="space-y-2">
              {service.features.map((feature, fi) => (
                <div key={fi} className="flex items-center gap-2">
                  <input
                    value={feature}
                    onChange={(e) => updateFeature(service.id, fi, e.target.value)}
                    placeholder="Next.js / React SPA"
                    className="flex-1 px-3 py-2 rounded-lg bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                  <button
                    onClick={() => removeFeature(service.id, fi)}
                    className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={() => addFeature(service.id)}
              className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar característica
            </button>
          </div>
        </div>
      ))}

      {/* Add service button */}
      <button
        onClick={addService}
        className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Agregar nuevo servicio
      </button>

      {/* Save bar */}
      <div className="flex items-center gap-4 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={status === "saving"}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-hover rounded-full transition-all duration-200 shadow-lg shadow-primary/25 disabled:opacity-60"
        >
          {status === "saving" ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Guardar Cambios
            </>
          )}
        </button>

        {status === "success" && (
          <span className="flex items-center gap-1.5 text-sm text-green-500">
            <CheckCircle2 className="w-4 h-4" />
            Guardado correctamente
          </span>
        )}

        {status === "error" && (
          <span className="flex items-center gap-1.5 text-sm text-red-500">
            <AlertCircle className="w-4 h-4" />
            {errorMsg}
          </span>
        )}
      </div>
    </div>
  );
}