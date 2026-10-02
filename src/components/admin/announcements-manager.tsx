"use client";

import { useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Pencil,
  Plus,
  Power,
  Trash2,
  X,
} from "lucide-react";
import {
  ANNOUNCEMENT_KINDS,
  ANNOUNCEMENT_STATUS_CLASSES,
  ANNOUNCEMENT_STATUS_LABELS,
  announcementKindMeta,
  announcementStatus,
  type AnnouncementKind,
} from "@/lib/announcements";

interface AnnouncementRow {
  id: number;
  title: string;
  body: string;
  kind: string;
  linkUrl: string | null;
  linkLabel: string | null;
  active: boolean;
  startsAt: string;
  endsAt: string;
  createdAt: string;
  readCount: number;
}

const DURATION_OPTIONS = [
  { value: "24h", label: "24 horas" },
  { value: "48h", label: "48 horas" },
  { value: "3d", label: "3 días" },
  { value: "7d", label: "7 días" },
  { value: "14d", label: "14 días" },
  { value: "30d", label: "30 días" },
  { value: "custom", label: "Personalizada (elige fecha de fin)" },
];

const DURATION_MS: Record<string, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "48h": 48 * 60 * 60 * 1000,
  "3d": 3 * 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "14d": 14 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const inputClass =
  "w-full px-3 py-2 rounded-lg bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** ISO → valor para <input type="datetime-local"> (hora local del admin). */
function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

/**
 * Gestor de anuncios globales: crear, editar, activar/desactivar y eliminar.
 * Al publicar se puede avisar por correo a todos los afiliados.
 */
export function AnnouncementsManager({
  announcements,
  totalAffiliates,
}: {
  announcements: AnnouncementRow[];
  totalAffiliates: number;
}) {
  const [items, setItems] = useState<AnnouncementRow[]>(announcements);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<AnnouncementKind>("INFO");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [startMode, setStartMode] = useState<"now" | "schedule">("now");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [duration, setDuration] = useState("7d");
  const [customEndsAt, setCustomEndsAt] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(false);

  function flash(type: "ok" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 6000);
  }

  function resetForm() {
    setShowForm(false);
    setEditingId(null);
    setTitle("");
    setBody("");
    setKind("INFO");
    setLinkUrl("");
    setLinkLabel("");
    setStartMode("now");
    setStartsAtLocal("");
    setDuration("7d");
    setCustomEndsAt("");
    setNotifyEmail(false);
  }

  function startEdit(row: AnnouncementRow) {
    setEditingId(row.id);
    setTitle(row.title);
    setBody(row.body);
    setKind(row.kind as AnnouncementKind);
    setLinkUrl(row.linkUrl ?? "");
    setLinkLabel(row.linkLabel ?? "");
    setStartMode("schedule");
    setStartsAtLocal(toLocalInput(row.startsAt));
    setDuration("custom");
    setCustomEndsAt(toLocalInput(row.endsAt));
    setNotifyEmail(false);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Calcula startsAt/endsAt a partir del formulario (o muestra error). */
  function buildDates(): { startsAt: string; endsAt: string } | null {
    const start = startMode === "now" ? new Date() : new Date(startsAtLocal);
    if (Number.isNaN(start.getTime())) {
      flash("error", "Indica la fecha de inicio.");
      return null;
    }
    let end: Date;
    if (duration === "custom") {
      end = new Date(customEndsAt);
      if (Number.isNaN(end.getTime())) {
        flash("error", "Indica la fecha de fin.");
        return null;
      }
    } else {
      end = new Date(start.getTime() + (DURATION_MS[duration] ?? DURATION_MS["7d"]));
    }
    if (end.getTime() <= start.getTime()) {
      flash("error", "La fecha de fin debe ser posterior al inicio.");
      return null;
    }
    return { startsAt: start.toISOString(), endsAt: end.toISOString() };
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const dates = buildDates();
    if (!dates) return;

    setSaving(true);
    try {
      if (editingId) {
        const response = await fetch(`/api/admin/announcements/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            kind,
            linkUrl,
            linkLabel,
            startsAt: dates.startsAt,
            endsAt: dates.endsAt,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          flash("error", json.error || "No se pudo guardar el anuncio.");
          return;
        }
        const updated = json.announcement;
        setItems((prev) =>
          prev.map((item) =>
            item.id === editingId
              ? {
                  ...item,
                  title: updated.title,
                  body: updated.body,
                  kind: updated.kind,
                  linkUrl: updated.linkUrl,
                  linkLabel: updated.linkLabel,
                  active: updated.active,
                  startsAt: updated.startsAt,
                  endsAt: updated.endsAt,
                }
              : item
          )
        );
        flash("ok", "Anuncio actualizado.");
        resetForm();
      } else {
        const response = await fetch("/api/admin/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            body,
            kind,
            linkUrl,
            linkLabel,
            startsAt: dates.startsAt,
            endsAt: dates.endsAt,
            notifyEmail,
          }),
        });
        const json = await response.json();
        if (!response.ok) {
          flash("error", json.error || "No se pudo publicar el anuncio.");
          return;
        }
        const created = json.announcement;
        setItems((prev) => [
          {
            id: created.id,
            title: created.title,
            body: created.body,
            kind: created.kind,
            linkUrl: created.linkUrl,
            linkLabel: created.linkLabel,
            active: created.active,
            startsAt: created.startsAt,
            endsAt: created.endsAt,
            createdAt: created.createdAt,
            readCount: 0,
          },
          ...prev,
        ]);
        if (notifyEmail && json.emailConfigured && json.emailed > 0) {
          flash(
            "ok",
            `Anuncio publicado y enviado por correo a ${json.emailed} afiliado${
              json.emailed === 1 ? "" : "s"
            }.`
          );
        } else if (notifyEmail && !json.emailConfigured) {
          flash(
            "ok",
            "Anuncio publicado en el panel. El correo aún no está configurado, así que no se envió por email."
          );
        } else if (notifyEmail) {
          flash("ok", `Anuncio publicado. Correos enviados: ${json.emailed} de ${json.totalAffiliates}.`);
        } else {
          flash("ok", "Anuncio publicado. Los afiliados lo verán al entrar a su panel.");
        }
        resetForm();
      }
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row: AnnouncementRow) {
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/admin/announcements/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !row.active }),
      });
      const json = await response.json();
      if (!response.ok) {
        flash("error", json.error || "No se pudo cambiar el estado.");
        return;
      }
      setItems((prev) => prev.map((item) => (item.id === row.id ? { ...item, active: !row.active } : item)));
      flash("ok", row.active ? "Anuncio desactivado." : "Anuncio activado.");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(row: AnnouncementRow) {
    if (!confirm(`¿Eliminar el anuncio «${row.title}»? Esta acción no se puede deshacer.`)) return;
    setBusyId(row.id);
    try {
      const response = await fetch(`/api/admin/announcements/${row.id}`, { method: "DELETE" });
      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        flash("error", json.error || "No se pudo eliminar el anuncio.");
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== row.id));
      flash("ok", "Anuncio eliminado.");
    } catch {
      flash("error", "Error de conexión.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <p
          className={`text-sm flex items-center gap-1.5 ${
            message.type === "ok" ? "text-green-500" : "text-accent"
          }`}
        >
          {message.type === "ok" ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          onClick={() => {
            if (showForm) {
              resetForm();
            } else {
              setShowForm(true);
            }
          }}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover"
        >
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          {showForm ? "Cerrar" : "Nuevo anuncio"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6 space-y-4">
          <div>
            <h3 className="font-bold">{editingId ? "Editar anuncio" : "Nuevo anuncio"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Los afiliados lo verán al entrar a su panel y no desaparece hasta que lo lean. Se
              oculta solo al vencer (o si lo desactivas).
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Tipo de anuncio</label>
              <select
                value={kind}
                onChange={(e) => setKind(e.target.value as AnnouncementKind)}
                className={inputClass}
              >
                {Object.entries(ANNOUNCEMENT_KINDS).map(([value, meta]) => (
                  <option key={value} value={value}>
                    {meta.emoji} {meta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={160}
                placeholder="Ej: Reunión por Zoom este viernes"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Mensaje</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={5}
              maxLength={5000}
              placeholder={
                "Escribe el anuncio completo. Puedes usar saltos de línea.\n\nEj: Este viernes a las 7:00 pm tendremos la clase de guías de trabajo por Zoom. Entra con el botón de abajo."
              }
              className={inputClass}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Enlace (opcional)</label>
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://zoom.us/j/..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Texto del botón (opcional)</label>
              <input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                maxLength={80}
                placeholder="Ej: Entrar a la reunión"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Inicio</label>
              <select
                value={startMode}
                onChange={(e) => setStartMode(e.target.value as "now" | "schedule")}
                className={inputClass}
              >
                <option value="now">Publicar ahora</option>
                <option value="schedule">Programar</option>
              </select>
              {startMode === "schedule" && (
                <input
                  type="datetime-local"
                  value={startsAtLocal}
                  onChange={(e) => setStartsAtLocal(e.target.value)}
                  required
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Duración</label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className={inputClass}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {duration === "custom" && (
                <input
                  type="datetime-local"
                  value={customEndsAt}
                  onChange={(e) => setCustomEndsAt(e.target.value)}
                  required
                  className={`${inputClass} mt-2`}
                />
              )}
            </div>
          </div>

          {!editingId && (
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Avisar también por correo a todos los afiliados
                <span className="block text-xs text-muted-foreground">
                  Envía el anuncio por email (Brevo). Si el correo aún no está configurado, el
                  anuncio igual se publica en el panel.
                </span>
              </span>
            </label>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Guardar cambios" : "Publicar anuncio"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-border hover:bg-surface-hover"
            >
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {items.map((row) => {
          const meta = announcementKindMeta(row.kind);
          const status = announcementStatus(row);
          return (
            <div key={row.id} className="rounded-2xl border border-border bg-surface p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${meta.badgeClass}`}
                    >
                      {meta.emoji} {meta.label}
                    </span>
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium border ${
                        ANNOUNCEMENT_STATUS_CLASSES[status]
                      }`}
                    >
                      {ANNOUNCEMENT_STATUS_LABELS[status]}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Leído por {row.readCount} de {totalAffiliates} afiliados
                    </span>
                  </div>
                  <p className="font-bold mt-2">{row.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(row)}
                    title="Editar"
                    className="p-2 rounded-lg border border-border hover:bg-surface-hover"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(row)}
                    disabled={busyId === row.id}
                    title={row.active ? "Desactivar" : "Activar"}
                    className="p-2 rounded-lg border border-border hover:bg-surface-hover disabled:opacity-60"
                  >
                    {busyId === row.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => remove(row)}
                    disabled={busyId === row.id}
                    title="Eliminar"
                    className="p-2 rounded-lg border border-border hover:bg-surface-hover text-accent disabled:opacity-60"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-3 whitespace-pre-line line-clamp-4">
                {row.body}
              </p>

              {row.linkUrl && (
                <p className="mt-3">
                  <a
                    href={row.linkUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-aff-cyan hover:underline break-all"
                  >
                    🔗 {row.linkLabel || row.linkUrl}
                  </a>
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-3">
                Del {formatDateTime(row.startsAt)} al {formatDateTime(row.endsAt)}
              </p>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center text-muted-foreground">
            Aún no hay anuncios. Publica el primero con el botón «Nuevo anuncio».
          </div>
        )}
      </div>
    </div>
  );
}
