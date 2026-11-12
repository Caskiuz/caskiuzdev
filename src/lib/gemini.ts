/**
 * Cliente compartido de Gemini (Google AI Studio · plan gratis) para TODO el
 * sistema: chat, KYC, scoring de leads, auto-respuestas, prospección con
 * Google Search grounding. Antes la lógica de cascada estaba duplicada en
 * chatbot.ts y kyc-ai.ts; ahora vive aquí.
 *
 * - Cascada de modelos con reintentos (saturación 429/5xx)
 * - Modo JSON, grounding con Google Search, timeouts, thinkingBudget 0
 * - Llamadas "utilitarias" (scoring, borradores) van primero a flash-lite
 *   para no quemar la cuota diaria del flash principal
 * - Cuota diaria por tipo en la tabla AiUsage (sobrevive serverless)
 * - Sin GEMINI_API_KEY todo degrada limpiamente (ok: false)
 */

import { prisma } from "@/lib/prisma/client";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
// Cascada principal: 2.5-flash (chat + grounding verificados) y 3.6-flash de
// respaldo. NOTA: 2.0-flash y 2.5-flash-lite ya NO sirven para claves nuevas.
const GEMINI_MODELS = Array.from(new Set([GEMINI_MODEL, "gemini-2.5-flash", "gemini-3.6-flash"]));
// Modelos "utilitarios" (JSON corto): el alias flash-lite-latest apunta al
// último Flash-Lite accesible; 3.5-flash-lite de respaldo y flash al final.
const GEMINI_LITE_MODELS = Array.from(
  new Set([
    ...(GEMINI_MODEL.includes("lite") ? [GEMINI_MODEL] : []),
    "gemini-flash-lite-latest",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ])
);

const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export function chatEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export interface GeminiTurn {
  role: "user" | "model";
  text: string;
}

/** Adjunto multimodal (imagen/PDF en base64, sin el prefijo data:) */
export interface GeminiAttachment {
  mimeType: string;
  data: string; // base64
}

export interface GeminiCallOptions {
  /** Prompt de un solo turno (atajo frente a contents) */
  prompt?: string;
  /** Historial multi-turno (usa role "model" para el asistente) */
  contents?: GeminiTurn[];
  /** Adjunto multimodal (solo válido con prompt, no con contents) */
  attachment?: GeminiAttachment;
  /** Instrucción de sistema */
  system?: string;
  temperature?: number;
  maxOutputTokens?: number;
  /** Fuerza respuesta JSON válida (responseMimeType application/json) */
  json?: boolean;
  /** Grounding con Google Search (búsquedas web del plan gratis) */
  grounding?: boolean;
  /** Modelos utilitarios primero (flash-lite) — para JSON corto */
  lite?: boolean;
  timeoutMs?: number;
}

export interface GeminiResult {
  ok: boolean;
  status: number;
  text: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function callGemini(options: GeminiCallOptions): Promise<GeminiResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || (!options.prompt && !options.contents?.length)) {
    return { ok: false, status: 503, text: "", error: "Gemini no configurado o prompt vacío" };
  }

  const models = options.lite ? GEMINI_LITE_MODELS : GEMINI_MODELS;
  const contents = options.contents
    ? options.contents.map((m) => ({ role: m.role, parts: [{ text: m.text.slice(0, 4000) }] }))
    : [
        {
          role: "user",
          parts: options.attachment
            ? [
                { inlineData: { mimeType: options.attachment.mimeType, data: options.attachment.data } },
                { text: options.prompt! },
              ]
            : [{ text: options.prompt! }],
        },
      ];

  let lastError = "sin respuesta";
  // Presupuesto total de tiempo: los reintentos de la cascada no pueden
  // exceder el timeout global (importante para el cron de Vercel, 60s máx).
  const deadline = Date.now() + (options.timeoutMs ?? 25000);

  // Dos rondas: si Google está saturado (429/5xx/503), esperamos y reintentamos
  for (let round = 0; round < 2; round++) {
    if (round > 0) await sleep(1500);
    if (Date.now() > deadline) break;

    for (const model of models) {
      if (Date.now() > deadline) break;
      const buildBody = (withThinkingConfig: boolean) => {
        const generationConfig: Record<string, unknown> = {
          temperature: options.temperature ?? 0.5,
          maxOutputTokens: options.maxOutputTokens ?? 1200,
        };
        if (options.json) generationConfig.responseMimeType = "application/json";
        // Los modelos con "pensamiento" consumen el presupuesto de salida en
        // el razonamiento interno y cortan la respuesta; lo desactivamos.
        if (withThinkingConfig) generationConfig.thinkingConfig = { thinkingBudget: 0 };

        const body: Record<string, unknown> = { contents, generationConfig };
        if (options.system) body.systemInstruction = { parts: [{ text: options.system }] };
        if (options.grounding) body.tools = [{ googleSearch: {} }];
        return body;
      };

      try {
        const doFetch = (withThinkingConfig: boolean) => {
          const ctrl = new AbortController();
          // Timeout por intento: nunca más de 30s (la cascada necesita espacio)
          const attemptTimeout = Math.min(options.timeoutMs ?? 25000, 30000);
          const timer = setTimeout(() => ctrl.abort(), attemptTimeout);
          return fetch(GEMINI_URL(model, apiKey), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(buildBody(withThinkingConfig)),
            signal: ctrl.signal,
          }).finally(() => clearTimeout(timer));
        };

        let res = await doFetch(true);
        let data: {
          candidates?: { content?: { parts?: { text?: string }[] } }[];
          error?: { message?: string };
        };
        try {
          data = await res.json();
        } catch {
          data = {};
        }

        // Si el modelo no soporta thinkingConfig, reintenta sin esa opción
        if (!res.ok && res.status === 400 && /thinking/i.test(data?.error?.message || "")) {
          res = await doFetch(false);
          try {
            data = await res.json();
          } catch {
            data = {};
          }
        }

        if (res.ok) {
          const text = data.candidates?.[0]?.content?.parts
            ?.map((p) => p.text ?? "")
            .join("")
            .trim();
          if (text) return { ok: true, status: res.status, text };
          lastError = "respuesta vacía";
        } else {
          lastError = data?.error?.message || `HTTP ${res.status}`;
          if (res.status === 429 || res.status >= 500) await sleep(800);
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "error de red";
      }
    }
  }

  return { ok: false, status: 502, text: "", error: lastError };
}

/** Limpia fences ```json y parsea la respuesta en modo JSON. Exportado para
 *  llamadas con grounding (que NO admiten responseMimeType: application/json). */
export function extractJson<T>(text: string): T | null {
  const cleaned = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Última línea: buscar el primer objeto/array balanceado
    const start = cleaned.search(/[[{]/);
    const end = Math.max(cleaned.lastIndexOf("]"), cleaned.lastIndexOf("}"));
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1)) as T;
    } catch {
      return null;
    }
  }
}

function parseJsonLoose<T>(text: string): T | null {
  return extractJson<T>(text);
}

export async function callGeminiJson<T>(
  options: GeminiCallOptions
): Promise<{ ok: boolean; data?: T; error?: string }> {
  const result = await callGemini({ ...options, json: true });
  if (!result.ok) return { ok: false, error: result.error };
  const data = parseJsonLoose<T>(result.text);
  if (data === null) return { ok: false, error: "La IA no devolvió JSON válido" };
  return { ok: true, data };
}

// ─── Cuota diaria compartida (tabla AiUsage) ───

export type AiUsageKind = "CHAT" | "SCORE" | "REPLY" | "PROSPECT" | "IMAGE";

const QUOTA_CAPS: Record<AiUsageKind, number> = {
  CHAT: 60, // mensajes de chat público/día (protege el free tier compartido con KYC)
  SCORE: 60,
  REPLY: 40, // auto-respuestas por email a visitantes
  PROSPECT: 3, // rondas de búsqueda con grounding (cada una devuelve varios prospectos)
  IMAGE: 40, // imágenes Pollinations servidas por el proxy
};

/** Devuelve las llamadas ya consumidas hoy para un tipo. */
export async function getAiUsageToday(kind: AiUsageKind): Promise<number> {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const row = await prisma.aiUsage.findUnique({
      where: { day_kind: { day, kind } },
    });
    return row?.count ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Incrementa la cuota diaria y devuelve false si ya se superó el tope.
 * Si la BD falla, permite la llamada (la feature nunca se bloquea por la DB).
 */
export async function checkAndIncrementAiQuota(kind: AiUsageKind): Promise<boolean> {
  const day = new Date().toISOString().slice(0, 10);
  try {
    const row = await prisma.aiUsage.upsert({
      where: { day_kind: { day, kind } },
      create: { day, kind, count: 1 },
      update: { count: { increment: 1 } },
    });
    return row.count <= QUOTA_CAPS[kind];
  } catch (error) {
    console.error("Error contando cuota de IA:", error);
    return true;
  }
}
