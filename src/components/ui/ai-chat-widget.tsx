"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Send, X, Loader2, Bot, MessageCircle, Mic, MicOff, UserPlus } from "lucide-react";
import { useReferralCode, appendReferralCode } from "@/lib/referral-cookie";

const RobotCanvas = dynamic(() => import("./chat-robot-3d"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <Bot className="w-7 h-7 text-aff-cyan" />
    </div>
  ),
});

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

/** Shape mínimo de SpeechRecognition (Web Speech API, sin tipos oficiales en TS DOM) */
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results?: { [key: number]: { [key: number]: { transcript: string } } } }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const QUICK_QUESTIONS = [
  "¿Cuánto cuesta una página web?",
  "Recomiéndame un servicio para mi negocio",
  "Quiero una cotización",
  "¿Cómo me uno al programa de afiliados?",
];

const STORAGE_KEY = "caskiuz_chat_history";

/**
 * Asistente de IA flotante v2 (Gemini vía /api/chat): robot 3D + mini aviso +
 * panel de chat con captura de leads (mini-form → /api/contact con el resumen
 * de la conversación) e input por voz (Web Speech API, gratis, con degradación).
 * Se oculta solo si el chat no está configurado en el servidor.
 */
export function AiChatWidget({ whatsapp = "584262931869" }: { whatsapp?: string }) {
  const referralCode = useReferralCode();
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    appendReferralCode("¡Hola Caskiuz! 👋 Vengo del asistente de la web y quiero conversar sobre un proyecto.", referralCode)
  )}`;
  const [available, setAvailable] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [banner, setBanner] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ChatMsg[]).slice(-20) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Captura de leads dentro del chat
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadDetail, setLeadDetail] = useState("");
  const [leadSending, setLeadSending] = useState(false);
  const [leadDone, setLeadDone] = useState(false);

  // Voz (Web Speech API)
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const recognitionRef = useRef<{ start: () => void; stop: () => void } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // ¿Está habilitado el chat en el servidor?
  useEffect(() => {
    let active = true;
    fetch("/api/chat")
      .then((r) => r.json())
      .then((data) => {
        if (active) setAvailable(Boolean(data?.enabled));
      })
      .catch(() => {
        if (active) setAvailable(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Historial guardado (se persiste en cada cambio)
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20)));
    } catch {
      // sin espacio: se ignora
    }
  }, [messages]);

  // Mini aviso a los 3 segundos (una vez por sesión)
  useEffect(() => {
    if (available !== true) return;
    if (sessionStorage.getItem("caskiuz_chat_banner") === "off") return;
    const t = setTimeout(() => setBanner(true), 3000);
    return () => clearTimeout(t);
  }, [available]);

  // Reconocimiento de voz (Chrome/Edge/Safari; en otros navegadores se oculta)
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) return;
    try {
      const rec = new SR();
      rec.lang = navigator.language?.toLowerCase().startsWith("en") ? "en-US" : "es-ES";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const text = e.results?.[0]?.[0]?.transcript;
        if (text) setInput((prev) => (prev ? `${prev} ` : "") + text);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      setVoiceSupported(true);
    } catch {
      setVoiceSupported(false);
    }
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, open, leadOpen]);

  function toggleVoice() {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      rec.stop();
      setListening(false);
    } else {
      rec.start();
      setListening(true);
    }
  }

  function dismissBanner() {
    setBanner(false);
    try {
      sessionStorage.setItem("caskiuz_chat_banner", "off");
    } catch {
      // ignorar
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || typing) return;
    dismissBanner();

    const next: ChatMsg[] = [...messages, { role: "user", content }];
    setMessages(next);
    setInput("");
    setTyping(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      if (!res.ok || !data?.reply) {
        setError(data?.error || "No pude responder. Intenta de nuevo.");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setTyping(false);
    }
  }

  /** Mini-form de captura: guarda el lead con el resumen de la conversación. */
  async function submitLead(e: React.FormEvent) {
    e.preventDefault();
    if (leadSending) return;
    if (!leadName.trim() || !leadContact.trim()) return;
    setLeadSending(true);
    setError(null);

    const userTurns = messages
      .filter((m) => m.role === "user")
      .slice(-3)
      .map((m) => m.content.slice(0, 140));
    const summary =
      (userTurns.length
        ? `Conversación previa: ${userTurns.join(" | ")}`
        : "Llegó por el asistente de IA") +
      (leadDetail.trim() ? ` · Detalle: ${leadDetail.trim().slice(0, 400)}` : "");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: leadName.trim(),
          email: leadContact.trim().includes("@") ? leadContact.trim() : `${leadContact.trim()}@chat.caskiuz`,
          phone: leadContact.trim().includes("@") ? null : leadContact.trim(),
          service: "otro",
          message: summary,
          source: "CHAT",
          refCode: referralCode || undefined,
        }),
      });
      if (!res.ok) throw new Error("error");
      setLeadDone(true);
      setLeadName("");
      setLeadContact("");
      setLeadDetail("");
      setTimeout(() => {
        setLeadOpen(false);
        setLeadDone(false);
      }, 6000);
    } catch {
      setError("No pude guardar tus datos. Escríbeme por WhatsApp 👇");
    } finally {
      setLeadSending(false);
    }
  }

  if (available !== true) return null;

  return (
    <>
      {/* Panel del chat */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className="fixed bottom-28 right-4 sm:right-6 z-[60] w-[calc(100vw-2rem)] max-w-sm metal-border rounded-2xl overflow-hidden shadow-2xl shadow-black/40"
          >
            <div className="bg-surface flex flex-col h-[26rem]">
              {/* Encabezado */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-surface-hover">
                <div className="w-9 h-9 shrink-0">
                  <RobotCanvas />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm leading-none">Asistente Caskiuz</p>
                  <p className="text-[11px] text-aff-cyan mt-1">
                    {typing ? "Escribiendo…" : "En línea · responde al instante"}
                  </p>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-2 rounded-lg hover:bg-surface transition-colors"
                  aria-label="Cerrar chat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mensajes / formulario de lead */}
              <div
                ref={listRef}
                data-lenis-prevent
                className="flex-1 overflow-y-auto p-4 space-y-3"
              >
                {leadOpen ? (
                  leadDone ? (
                    <div className="text-center pt-6">
                      <div className="w-14 h-14 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-3">
                        <MessageCircle className="w-7 h-7 text-green-500" />
                      </div>
                      <p className="text-sm font-semibold">¡Datos recibidos! 🎉</p>
                      <p className="text-xs text-muted-foreground mt-2 mb-4">
                        Caskiuz te escribirá en menos de 24 horas. Si prefieres, adelanta por WhatsApp ahora.
                      </p>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold text-white bg-[#25D366] hover:bg-[#22c55e] transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Hablar por WhatsApp
                      </a>
                    </div>
                  ) : (
                    <form onSubmit={submitLead} className="space-y-2.5 pt-1">
                      <p className="text-sm font-semibold">📩 Déjame tus datos</p>
                      <p className="text-xs text-muted-foreground">
                        Caskiuz te contacta con una propuesta concreta.
                      </p>
                      <input
                        value={leadName}
                        onChange={(e) => setLeadName(e.target.value)}
                        placeholder="Tu nombre"
                        required
                        maxLength={60}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aff-blue/50"
                      />
                      <input
                        value={leadContact}
                        onChange={(e) => setLeadContact(e.target.value)}
                        placeholder="Email o WhatsApp"
                        required
                        maxLength={80}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aff-blue/50"
                      />
                      <textarea
                        value={leadDetail}
                        onChange={(e) => setLeadDetail(e.target.value)}
                        placeholder="¿Qué necesitas? (opcional)"
                        rows={2}
                        maxLength={400}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-sm resize-none focus:outline-none focus:ring-2 focus:ring-aff-blue/50"
                      />
                      <button
                        type="submit"
                        disabled={leadSending || !leadName.trim() || !leadContact.trim()}
                        className="w-full py-2.5 text-sm font-semibold btn-aff rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
                      >
                        {leadSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Enviando…
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" /> Enviar mis datos
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeadOpen(false)}
                        className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Volver al chat
                      </button>
                    </form>
                  )
                ) : (
                  <>
                    {messages.length === 0 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground mb-4">
                          👋 ¡Hola! Soy el asistente de Caskiuz. Pregúntame lo que quieras
                          sobre servicios, precios o el programa de afiliados.
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {QUICK_QUESTIONS.map((q) => (
                            <button
                              key={q}
                              onClick={() => send(q)}
                              className="px-3 py-1.5 rounded-full text-xs border border-aff-blue/30 bg-aff-blue/5 text-aff-cyan hover:bg-aff-blue/15 transition-colors"
                            >
                              {q}
                            </button>
                          ))}
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-[#25D366]/40 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" /> Hablar por WhatsApp
                          </a>
                        </div>
                      </div>
                    )}

                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                            m.role === "user"
                              ? "bg-gradient-to-br from-aff-blue-deep to-aff-blue text-white rounded-br-md"
                              : "bg-surface-hover border border-border text-muted-foreground rounded-bl-md"
                          }`}
                        >
                          {m.content}
                        </div>
                      </div>
                    ))}

                    {typing && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface-hover border border-border flex items-center gap-1.5">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                              className="w-1.5 h-1.5 rounded-full bg-aff-cyan"
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {error && (
                      <p className="text-xs text-accent text-center bg-accent/5 border border-accent/15 rounded-xl p-2.5">
                        {error}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Entrada */}
              <div className="border-t border-border">
                {!leadOpen && (
                  <button
                    onClick={() => setLeadOpen(true)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] font-medium text-aff-cyan hover:bg-aff-cyan/10 transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Déjame tus datos y te contacta hoy
                  </button>
                )}
                {!leadOpen && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> ¿Prefieres WhatsApp? Escríbenos aquí
                  </a>
                )}
                {!leadOpen && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      send(input);
                    }}
                    className="flex items-center gap-2 p-3 pt-0"
                  >
                    {voiceSupported && (
                      <button
                        type="button"
                        onClick={toggleVoice}
                        className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                          listening
                            ? "bg-accent/10 border-accent/40 text-accent animate-pulse"
                            : "bg-surface border-border text-muted-foreground hover:text-aff-cyan hover:border-aff-cyan/40"
                        }`}
                        aria-label={listening ? "Detener dictado" : "Dictar por voz"}
                        title={listening ? "Detener dictado" : "Dictar por voz"}
                      >
                        {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    )}
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder={listening ? "Escuchando… habla ahora" : "Escribe tu pregunta…"}
                      maxLength={500}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-surface border border-border text-sm focus:outline-none focus:ring-2 focus:ring-aff-blue/50"
                    />
                    <button
                      type="submit"
                      disabled={typing || !input.trim()}
                      className="btn-aff p-2.5 rounded-xl disabled:opacity-50 shrink-0"
                      aria-label="Enviar"
                    >
                      {typing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini aviso */}
      <AnimatePresence>
        {banner && !open && (
          <motion.div
            initial={{ opacity: 0, x: 16, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 16, scale: 0.95 }}
            className="fixed bottom-[5.6rem] right-20 sm:right-24 z-[59] max-w-[15rem]"
          >
            <div className="metal-card rounded-2xl rounded-br-md px-4 py-3 shadow-xl shadow-black/30">
              <button
                onClick={dismissBanner}
                className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-surface border border-border flex items-center justify-center hover:bg-surface-hover"
                aria-label="Cerrar aviso"
              >
                <X className="w-3 h-3" />
              </button>
              <p className="text-sm font-semibold text-aff-cyan">¿Te puedo ayudar con algo?</p>
              <p className="text-xs text-muted-foreground mt-1">Pregunta lo que quieras 🤖</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón flotante con robot 3D */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => {
          setOpen((v) => !v);
          dismissBanner();
        }}
        className="fixed bottom-5 right-4 sm:right-6 z-[60] w-[4.5rem] h-[4.5rem] rounded-full metal-border metal-shine overflow-hidden"
        aria-label="Abrir asistente de IA"
      >
        <div className="w-full h-full bg-[#0b0d14]">
          <RobotCanvas />
        </div>
        {!open && (
          <span className="absolute top-1.5 right-1.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0b0d14]" />
        )}
      </motion.button>
    </>
  );
}
