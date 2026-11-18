/**
 * Router de IA multi-proveedor — el "motor que nunca muere".
 *
 * Patrón portado de C:\AI-workflow-multimedia (Caskiuz AI, Rust):
 *   1. Cadena escalonada: Gemini → OpenRouter (:free) → Groq → Pollinations
 *      (keyless, siempre disponible) — cada tier se normaliza al mismo
 *      resultado para el consumidor.
 *   2. Pre-vuelo de cuota: cuando un proveedor responde 429 de cuota, se marca
 *      muerto EN LA DB (tabla AiUsage, clave DEAD:{proveedor} por día) y las
 *      siguientes llamadas lo saltan sin gastar un solo request.
 *   3. Rotación pegajosa: cada proveedor con varios modelos recuerda cuál
 *      funcionó la última vez y empieza por él.
 *   4. Guards is_configured: sin OPENROUTER_API_KEY/GROQ_API_KEY esos tiers
 *      se saltan en silencio — la web degrada, nunca muere.
 *
 * Uso: import { callAI, textEnabled } from "@/lib/ai-router".
 * El grounding (prospección) y la visión (KYC) siguen en gemini.ts: son
 * capacidades exclusivas de Gemini.
 */

import { prisma } from "@/lib/prisma/client";
import { callGemini, type GeminiCallOptions } from "@/lib/gemini";

export interface AICallOptions {
  system?: string;
  prompt?: string;
  contents?: { role: "user" | "model"; text: string }[];
  temperature?: number;
  maxOutputTokens?: number;
  /** Pedir JSON (mime en Gemini, response_format en OpenAI-compat, prompt en Pollinations) */
  json?: boolean;
  /** Modelos utilitarios primero en Gemini (flash-lite) */
  lite?: boolean;
  timeoutMs?: number;
}

export interface AIResult {
  ok: boolean;
  text: string;
  /** Proveedor que respondió ("gemini" | "openrouter" | "groq" | "pollinations") */
  provider?: string;
  /** URLs fuente reales de Google (solo Gemini con grounding) */
  sources?: string[];
  error?: string;
}

// ─── Marcas de proveedor muerto por día (tabla AiUsage, sobrevive serverless) ───

async function isProviderDead(provider: string): Promise<boolean> {
  try {
    const day = new Date().toISOString().slice(0, 10);
    const row = await prisma.aiUsage.findUnique({
      where: { day_kind: { day, kind: `DEAD:${provider}` } },
    });
    return Boolean(row);
  } catch {
    return false; // si la DB falla, no bloqueamos
  }
}

/** Marca un proveedor agotado HOY (solo por 429 de cuota; 5xx son transitorios). */
async function markProviderDead(provider: string): Promise<void> {
  try {
    const day = new Date().toISOString().slice(0, 10);
    await prisma.aiUsage.upsert({
      where: { day_kind: { day, kind: `DEAD:${provider}` } },
      create: { day, kind: `DEAD:${provider}`, count: 1 },
      update: { count: { increment: 1 } },
    });
  } catch {
    // no bloquea
  }
}

function isQuotaError(status: number, error?: string): boolean {
  return status === 429 || /quota|exceeded your current quota|rate limit/i.test(error || "");
}

// ─── OpenRouter — SOLO modelos gratis, costo cero garantizado ───
// Tres candados para que nunca haya costo:
//   1. Anillo dinámico: se descarga el catálogo de OpenRouter y SOLO entran
//      modelos con id ":free" y pricing.prompt/completion == 0.
//   2. "provider.allow_fallbacks: false": OpenRouter NO puede rutar a un
//      proveedor de pago aunque el free esté lleno.
//   3. "reasoning.exclude": los modelos reasoning devuelven content directo
//      (si aún devuelven content null, el anillo salta al siguiente modelo).

const OPENROUTER_FALLBACK_RING = (
  process.env.OPENROUTER_MODELS ||
  ["google/gemma-4-31b-it:free", "nvidia/nemotron-3.5-lightning:free", "liquid/lfm-3-1.7b:free"].join(",")
)
  .split(",")
  .map((m) => m.trim())
  .filter((m) => m.endsWith(":free"));

let openrouterRingCache: { models: string[]; at: number } | null = null;
const RING_TTL_MS = 6 * 3600 * 1000; // refresca el catálogo cada 6 horas

async function getOpenRouterFreeRing(apiKey: string): Promise<string[]> {
  if (openrouterRingCache && Date.now() - openrouterRingCache.at < RING_TTL_MS) {
    return openrouterRingCache.models;
  }
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as {
      data?: {
        id: string;
        pricing?: { prompt?: string; completion?: string };
        context_length?: number;
      }[];
    };
    const free = (data.data ?? [])
      .filter((m) => {
        const id = m.id.toLowerCase();
        const zero = m.pricing && parseFloat(m.pricing.prompt || "1") === 0 && parseFloat(m.pricing.completion || "1") === 0;
        return id.endsWith(":free") && zero && !/embed|whisper|tts|image|rerank|guard|moderation|video/.test(id);
      })
      .sort((a, b) => (b.context_length ?? 0) - (a.context_length ?? 0))
      .slice(0, 12)
      .map((m) => m.id);
    if (free.length) {
      openrouterRingCache = { models: free, at: Date.now() };
      return free;
    }
    throw new Error("sin modelos gratis en el catálogo");
  } catch {
    // Sin catálogo: lista estática (igualmente solo :free) + rotación que salta
    // los modelos caídos
    return OPENROUTER_FALLBACK_RING;
  }
}

let openrouterStart = 0; // índice "pegajoso": arranca por el último que funcionó

function openrouterConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** Traduce el formato Gemini a mensajes OpenAI (chat completions). */
function toOpenAIMessages(options: AICallOptions): OpenAIMessage[] {
  const messages: OpenAIMessage[] = [];
  if (options.system) messages.push({ role: "system", content: options.system });
  if (options.contents) {
    for (const turn of options.contents) {
      messages.push({
        role: turn.role === "user" ? "user" : "assistant",
        content: turn.text.slice(0, 4000),
      });
    }
  } else if (options.prompt) {
    messages.push({ role: "user", content: options.prompt });
  }
  return messages;
}

/** Proveedores OpenAI-compatibles (OpenRouter, Groq): misma forma de request. */
async function callOpenAICompat(
  provider: "openrouter" | "groq",
  baseUrl: string,
  apiKey: string,
  models: string[],
  options: AICallOptions,
  timeoutMs: number
): Promise<AIResult> {
  const messages = toOpenAIMessages(options);
  let lastError = "sin respuesta";

  for (let off = 0; off < models.length; off++) {
    const idx = (provider === "openrouter" ? openrouterStart : groqStart + off) % models.length;
    const model = models[idx];
    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          ...(provider === "openrouter"
            ? { "HTTP-Referer": "https://caskiuz.vercel.app", "X-Title": "Caskiuz Portfolio" }
            : {}),
        },
        body: JSON.stringify({
          model,
          messages,
          temperature: options.temperature ?? 0.5,
          max_tokens: options.maxOutputTokens ?? 1200,
          ...(options.json ? { response_format: { type: "json_object" } } : {}),
          // Costo cero garantizado: sin caída a proveedores de pago
          ...(provider === "openrouter" ? { provider: { allow_fallbacks: false } } : {}),
          // Los reasoning devuelven content directo en vez de quemar tokens
          ...(provider === "openrouter" ? { reasoning: { exclude: true } } : {}),
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      const data = (await res.json().catch(() => ({}))) as {
        choices?: { message?: { content?: string | null; reasoning?: string | null } }[];
        error?: { message?: string };
      };
      const content = data.choices?.[0]?.message?.content?.trim();
      if (res.ok && content) {
        if (provider === "openrouter") openrouterStart = idx;
        else groqStart = idx;
        console.info(`🧠 Router IA: ${provider}/${model}`);
        return { ok: true, text: content, provider };
      }
      // content null + reasoning = modelo reasoning agotó tokens: no sirve, siguiente
      lastError = data.error?.message || (content === null ? "content null (reasoning)" : `HTTP ${res.status}`);
      continue;
    } catch (error) {
      lastError = error instanceof Error ? error.message : "error de red";
    }
  }
  return { ok: false, text: "", provider, error: lastError };
}

let groqStart = 0;

const GROQ_MODELS = (process.env.GROQ_MODELS || "llama-3.3-70b-versatile,llama-3.1-8b-instant")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

// ─── Pollinations texto (keyless: el último recurso que NUNCA se agota) ───

async function callPollinationsText(options: AICallOptions): Promise<AIResult> {
  const messages = toOpenAIMessages(options);
  const model = process.env.POLLINATIONS_TEXT_MODEL || "openai";
  // POST OpenAI-compatible; si falla, GET simple de un solo turno
  try {
    const res = await fetch("https://text.pollinations.ai/openai", {
      method: "POST",
      headers: { "Content-Type": "application/json", Referer: "https://caskiuz.vercel.app" },
      body: JSON.stringify({
        model,
        messages,
        temperature: options.temperature ?? 0.5,
        ...(options.maxOutputTokens ? { max_tokens: options.maxOutputTokens } : {}),
        seed: Math.floor(Math.random() * 1_000_000),
        referrer: "caskiuz.vercel.app",
      }),
      signal: AbortSignal.timeout(options.timeoutMs ?? 30000),
    });
    const data = (await res.json().catch(() => ({}))) as {
      choices?: { message?: { content?: string } }[];
      error?: string | { message?: string };
    };
    const text = data.choices?.[0]?.message?.content?.trim();
    if (res.ok && text) return { ok: true, text, provider: "pollinations" };
  } catch {
    /* cae al GET */
  }

  // GET de un solo turno (prompt + system inline)
  try {
    const promptText = [options.system, options.prompt || options.contents?.at(-1)?.text]
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 6000);
    const res = await fetch(
      `https://text.pollinations.ai/${encodeURIComponent(promptText)}?model=${model}&referrer=caskiuz.vercel.app`,
      { signal: AbortSignal.timeout(options.timeoutMs ?? 30000) }
    );
    if (res.ok) {
      const text = (await res.text()).trim();
      if (text) return { ok: true, text, provider: "pollinations" };
    }
    return { ok: false, text: "", provider: "pollinations", error: `HTTP ${res.status}` };
  } catch (error) {
    return {
      ok: false,
      text: "",
      provider: "pollinations",
      error: error instanceof Error ? error.message : "error de red",
    };
  }
}

// ─── El router ───

export function textEnabled(): boolean {
  // Pollinations es keyless: si hay código, hay cerebro.
  return true;
}

export async function callAI(options: AICallOptions): Promise<AIResult> {
  const deadline = Date.now() + (options.timeoutMs ?? 45000);

  // Tier 1: Gemini (pre-vuelo: si está marcado muerto hoy, ni lo intentamos)
  if (!(await isProviderDead("gemini"))) {
    const gemini = await callGemini({
      system: options.system,
      prompt: options.prompt,
      contents: options.contents,
      temperature: options.temperature,
      maxOutputTokens: options.maxOutputTokens,
      json: options.json,
      lite: options.lite,
      timeoutMs: Math.min(options.timeoutMs ?? 45000, 40000),
    } as GeminiCallOptions);
    if (gemini.ok) {
      return { ok: true, text: gemini.text, provider: "gemini", sources: gemini.sources };
    }
    if (isQuotaError(gemini.status, gemini.error)) {
      await markProviderDead("gemini");
    }
  }

  // Tier 2: OpenRouter (clave gratuita propia; salta si no está configurada)
  if (openrouterConfigured() && !(await isProviderDead("openrouter")) && Date.now() < deadline) {
    const ring = await getOpenRouterFreeRing(process.env.OPENROUTER_API_KEY as string);
    const or = await callOpenAICompat(
      "openrouter",
      "https://openrouter.ai/api/v1",
      process.env.OPENROUTER_API_KEY as string,
      ring,
      options,
      25000
    );
    if (or.ok) return or;
    if (isQuotaError(0, or.error)) {
      // OpenRouter reporta cuota en el mensaje; 429 de cada modelo se maneja
      // dentro de la rotación — marcar muerto solo si TODO el anillo falló por cuota
      if (/quota|exceed|rate limit/i.test(or.error || "")) await markProviderDead("openrouter");
    }
  }

  // Tier 3: Groq (free: ~1000 req/día)
  if (process.env.GROQ_API_KEY && !(await isProviderDead("groq")) && Date.now() < deadline) {
    const groq = await callOpenAICompat(
      "groq",
      "https://api.groq.com/openai/v1",
      process.env.GROQ_API_KEY as string,
      GROQ_MODELS,
      options,
      20000
    );
    if (groq.ok) return groq;
    if (isQuotaError(0, groq.error)) await markProviderDead("groq");
  }

  // Tier 4: Pollinations texto — keyless, nunca se marca muerto
  return callPollinationsText(options);
}
