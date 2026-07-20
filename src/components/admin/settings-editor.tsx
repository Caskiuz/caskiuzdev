"use client";

import { useState } from "react";
import { Save, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

interface Field {
  key: string;
  label: string;
  type?: "text" | "textarea" | "url" | "email" | "number";
  placeholder?: string;
}

interface Props {
  group: string;
  title: string;
  description?: string;
  fields: Field[];
  initialData: Record<string, string>;
}

export function SettingsEditor({
  group,
  title,
  description,
  fields,
  initialData,
}: Props) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of fields) {
      init[f.key] = initialData[f.key] || "";
    }
    return init;
  });

  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setStatus("saving");
    setErrorMsg("");

    const configs = Object.entries(values).map(([key, value]) => ({
      key,
      value,
      group,
    }));

    try {
      const res = await fetch("/api/admin/site-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ configs }),
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
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">
          Editar{" "}
          <span className="gradient-text">{title}</span>
        </h1>
        {description && (
          <p className="mt-2 text-muted-foreground">{description}</p>
        )}
      </div>

      <div className="glass-card p-6 space-y-5">
        {fields.map((field) => (
          <div key={field.key}>
            <label
              htmlFor={field.key}
              className="block text-sm font-medium mb-2"
            >
              {field.label}
            </label>
            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                rows={4}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm resize-none"
              />
            ) : (
              <input
                id={field.key}
                type={field.type || "text"}
                value={values[field.key] || ""}
                onChange={(e) => handleChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
              />
            )}
          </div>
        ))}

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
    </div>
  );
}