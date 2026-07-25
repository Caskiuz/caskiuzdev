"use client";

import { useState } from "react";
import { Star, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useRouter } from "next/navigation";

interface TestimonialRow {
  id: number;
  name: string;
  role: string | null;
  company: string | null;
  content: string;
  rating: number;
  approved: boolean;
  createdAt: string;
}

interface Props {
  initialTestimonials: TestimonialRow[];
}

export function TestimonialsClient({ initialTestimonials }: Props) {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState<TestimonialRow[]>(initialTestimonials);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const handleToggleApproval = async (id: number, approved: boolean) => {
    setActionLoading(id);
    try {
      const res = await fetch("/api/admin/testimonials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, approved: !approved }),
      });
      if (res.ok) {
        setTestimonials((prev) =>
          prev.map((t) => (t.id === id ? { ...t, approved: !approved } : t))
        );
      }
    } catch (err) {
      console.error("Error updating testimonial:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar este testimonio permanentemente?")) return;
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/testimonials?id=${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setTestimonials((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (err) {
      console.error("Error deleting testimonial:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const pending = testimonials.filter((t) => !t.approved);
  const approved = testimonials.filter((t) => t.approved);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Testimonios</h1>
        <p className="text-muted-foreground mt-1">
          Gestiona los testimonios enviados por clientes. Solo los aprobados se muestran en el sitio.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold gradient-text">{testimonials.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-green-500">{approved.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Aprobados</p>
        </div>
        <div className="glass-card p-4 text-center">
          <p className="text-3xl font-bold text-yellow-500">{pending.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
        </div>
      </div>

      {/* Pending first */}
      {pending.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Pendientes de aprobación ({pending.length})
          </h2>
          {renderTable(pending)}
        </div>
      )}

      {/* Approved */}
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          Aprobados ({approved.length})
        </h2>
        {approved.length === 0 ? (
          <p className="text-muted-foreground text-sm py-8 text-center glass-card">
            No hay testimonios aprobados aún.
          </p>
        ) : (
          renderTable(approved)
        )}
      </div>
    </div>
  );

  function renderTable(rows: TestimonialRow[]) {
    return (
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
              <th className="p-3">Nombre</th>
              <th className="p-3 hidden sm:table-cell">Rol / Empresa</th>
              <th className="p-3 hidden md:table-cell">Comentario</th>
              <th className="p-3">Rating</th>
              <th className="p-3">Estado</th>
              <th className="p-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id} className="border-b border-border/50 hover:bg-surface-hover transition-colors">
                <td className="p-3 font-medium">{t.name}</td>
                <td className="p-3 hidden sm:table-cell text-muted-foreground text-xs">
                  {t.role || "-"}{t.company ? ` · ${t.company}` : ""}
                </td>
                <td className="p-3 hidden md:table-cell text-muted-foreground text-xs max-w-xs truncate">
                  {t.content}
                </td>
                <td className="p-3">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < t.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </td>
                <td className="p-3">
                  {t.approved ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-500/10 px-2 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3 h-3" />
                      Aprobado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      <Clock className="w-3 h-3" />
                      Pendiente
                    </span>
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleToggleApproval(t.id, t.approved)}
                      disabled={actionLoading === t.id}
                      title={t.approved ? "Rechazar" : "Aprobar"}
                      className={`p-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                        t.approved
                          ? "hover:bg-yellow-500/10 text-yellow-500"
                          : "hover:bg-green-500/10 text-green-500"
                      }`}
                    >
                      {t.approved ? (
                        <XCircle className="w-4 h-4" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(t.id)}
                      disabled={actionLoading === t.id}
                      title="Eliminar"
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}