import { NextRequest, NextResponse } from "next/server";
import { chatEnabled, chatWithGemini, type ChatMessage } from "@/lib/chatbot";

export const dynamic = "force-dynamic";

/** Indica si el chat está habilitado (el widget se oculta si no lo está) */
export async function GET() {
  return NextResponse.json({ enabled: chatEnabled() });
}

export async function POST(request: NextRequest) {
  if (!chatEnabled()) {
    return NextResponse.json(
      { error: "El asistente no está disponible en este momento." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const rawMessages = body?.messages;

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
    }

    const messages: ChatMessage[] = rawMessages
      .slice(-10)
      .filter(
        (m: unknown): m is ChatMessage =>
          typeof m === "object" &&
          m !== null &&
          ((m as ChatMessage).role === "user" || (m as ChatMessage).role === "assistant") &&
          typeof (m as ChatMessage).content === "string" &&
          (m as ChatMessage).content.trim().length > 0
      )
      .map((m: ChatMessage) => ({ role: m.role, content: m.content.slice(0, 1500) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Mensajes inválidos" }, { status: 400 });
    }

    const reply = await chatWithGemini(messages);
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return NextResponse.json(
      { error: "El asistente no está disponible en este momento. Escríbenos por WhatsApp." },
      { status: 502 }
    );
  }
}
