"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, ArrowUpRight } from "lucide-react";

export interface NotificationItem {
  id: number;
  kind: string;
  title: string;
  body: string | null;
  linkUrl: string | null;
  createdAt: string;
  read: boolean;
}

const KIND_EMOJI: Record<string, string> = {
  NEW_LEAD: "🧲",
  LEAD_ASSIGNED: "🤝",
  SALE: "🛒",
  KYC: "📄",
  WITHDRAWAL: "💳",
  TICKET: "💬",
  INFO: "📣",
};

/**
 * Lista de notificaciones internas. Al abrir la página, las no leídas se
 * marcan solas como leídas (aviso idempotente) y se refresca la página
 * para que los badges del menú se actualicen.
 */
export function NotificationsClient({
  items,
  readEndpoint,
}: {
  items: NotificationItem[];
  readEndpoint: string;
}) {
  const router = useRouter();

  useEffect(() => {
    const unreadIds = items.filter((item) => !item.read).map((item) => item.id);
    if (unreadIds.length === 0) return;
    fetch(readEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: unreadIds }),
    })
      .then(() => router.refresh())
      .catch(() => {
        // sin conexión: las notificaciones siguen visibles; se marcarán al volver
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readEndpoint]);

  if (items.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Sin notificaciones</h3>
        <p className="text-muted-foreground">
          Aquí verás los avisos del sistema: leads nuevos, ventas, documentos y más.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => {
        const content = (
          <div
            className={`rounded-2xl border p-4 sm:p-5 transition-colors ${
              item.read
                ? "border-border bg-surface"
                : "border-primary/30 bg-primary/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0 mt-0.5" aria-hidden>
                {KIND_EMOJI[item.kind] ?? "📣"}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold text-sm ${item.read ? "" : "text-foreground"}`}>
                  {item.title}
                </p>
                {item.body && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                    {item.body}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {new Date(item.createdAt).toLocaleString("es-VE", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </p>
              </div>
              {item.linkUrl && (
                <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              )}
            </div>
          </div>
        );

        return item.linkUrl ? (
          <Link key={item.id} href={item.linkUrl} className="block hover:opacity-90">
            {content}
          </Link>
        ) : (
          <div key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}
