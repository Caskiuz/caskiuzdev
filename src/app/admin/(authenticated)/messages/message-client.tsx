"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Circle, ChevronDown, ChevronUp, Clock } from "lucide-react";

interface Message {
  id: number;
  name: string;
  email: string;
  service: string | null;
  message: string;
  read: boolean;
  createdAt: string;
}

interface Props {
  messages: Message[];
  markAsRead: (id: number) => Promise<void>;
  markAsUnread: (id: number) => Promise<void>;
}

export function MessageClient({ messages, markAsRead, markAsUnread }: Props) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggleExpand = (id: number) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRead = async (id: number, read: boolean) => {
    if (read) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  };

  if (messages.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No hay mensajes</h3>
        <p className="text-muted-foreground">
          Los mensajes del formulario de contacto aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`glass-card transition-all ${
            !msg.read ? "border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div
            className="p-4 sm:p-5 cursor-pointer flex items-start gap-4"
            onClick={() => toggleExpand(msg.id)}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleRead(msg.id, msg.read);
              }}
              className="mt-0.5 flex-shrink-0"
              title={msg.read ? "Marcar como no leído" : "Marcar como leído"}
            >
              {msg.read ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <Circle className="w-5 h-5 text-primary" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={`font-semibold truncate ${!msg.read ? "text-foreground" : ""}`}>
                  {msg.name}
                </h3>
                <span className="text-xs text-muted-foreground">{msg.email}</span>
                {msg.service && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-surface border border-border">
                    {msg.service}
                  </span>
                )}
              </div>

              {expanded.has(msg.id) ? (
                <div className="mt-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                    {msg.message}
                  </p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.createdAt).toLocaleString("es-VE", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground truncate mt-1">
                  {msg.message}
                </p>
              )}
            </div>

            <div className="flex-shrink-0 text-muted-foreground">
              {expanded.has(msg.id) ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}