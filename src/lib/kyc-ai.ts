/**
 * Lectura automática del nombre en documentos KYC con Gemini (visión).
 * IMPORTANTE: solo LEE el nombre y lo devuelve — la aprobación del documento
 * sigue siendo manual del admin. Si Gemini falla o está desactivado, devuelve
 * null y todo sigue como siempre (revisión a ojo).
 *
 * Se puede apagar con KYC_AI_READ="off" en las variables de entorno.
 */

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const GEMINI_MODELS = Array.from(
  new Set([GEMINI_MODEL, "gemini-2.5-flash", "gemini-3.6-flash"])
);
const GEMINI_URL = (model: string, key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;

export function kycAiReadEnabled(): boolean {
  const flag = (process.env.KYC_AI_READ || "on").trim().toLowerCase();
  return Boolean(process.env.GEMINI_API_KEY) && flag !== "off";
}

export interface ExtractedDocumentInfo {
  readable: boolean;
  documentType: string | null;
  name: string | null;
  idNumber: string | null;
}

const PROMPT = `Eres un verificador de identidad KYC. Analiza el documento de identidad adjunto (foto de cédula, DNI o pasaporte) y extrae los datos visibles.

Responde ÚNICAMENTE con un JSON válido, sin markdown, con esta forma exacta:
{"readable": true, "documentType": "CEDULA|DNI|PASAPORTE|OTRO", "name": "NOMBRES Y APELLIDOS COMPLETOS del titular tal como aparecen", "idNumber": "número de documento tal como aparece"}

Reglas estrictas:
- readable=false si la imagen es ilegible, borrosa o no es un documento de identidad; en ese caso name=null e idNumber=null.
- Copia el nombre EXACTAMENTE como aparece, aunque el orden sea apellidos primero.
- No inventes ni completes datos que no se vean con claridad.
- No incluyas nada fuera del JSON.`;

function parseModelJson(text: string): Partial<ExtractedDocumentInfo> | null {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as Partial<ExtractedDocumentInfo>;
  } catch {
    return null;
  }
}

/** Tiempo máximo por intento de lectura (el trabajo corre en segundo plano). */
const PER_ATTEMPT_TIMEOUT_MS = 8000;

async function callModel(
  apiKey: string,
  model: string,
  mimeType: string,
  data: string,
  withThinkingConfig: boolean
): Promise<{ ok: boolean; status: number; errorMsg: string; text: string }> {
  const generationConfig: Record<string, unknown> = {
    temperature: 0,
    maxOutputTokens: 400,
    responseMimeType: "application/json",
  };
  // Los modelos "pensantes" gastan el presupuesto de salida en razonamiento;
  // lo desactivamos y reintentamos sin la opción si el modelo no la soporta.
  if (withThinkingConfig) {
    generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PER_ATTEMPT_TIMEOUT_MS);
  try {
    const res = await fetch(GEMINI_URL(model, apiKey), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ inlineData: { mimeType, data } }, { text: PROMPT }],
          },
        ],
        generationConfig,
      }),
      signal: controller.signal,
    });

    const json = (await res.json().catch(() => ({}))) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      error?: { message?: string };
    };

    const text =
      json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    return {
      ok: res.ok,
      status: res.status,
      errorMsg: json.error?.message || `HTTP ${res.status}`,
      text,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Envía el documento a Gemini y devuelve el nombre leído.
 * null = no se pudo leer / IA desactivada / error (nunca lanza).
 */
export async function extractDocumentName(
  fileData: string
): Promise<ExtractedDocumentInfo | null> {
  if (!kycAiReadEnabled()) return null;

  const match = /^data:((?:image\/[a-z0-9.+-]+)|(?:application\/pdf));base64,(.+)$/i.exec(
    fileData
  );
  if (!match) return null;

  const mimeType = match[1].toLowerCase();
  const data = match[2];
  const apiKey = process.env.GEMINI_API_KEY as string;

  for (const model of GEMINI_MODELS) {
    try {
      let res = await callModel(apiKey, model, mimeType, data, true);
      if (!res.ok && res.status === 400 && /thinking/i.test(res.errorMsg)) {
        res = await callModel(apiKey, model, mimeType, data, false);
      }
      if (!res.ok) {
        console.error(`KYC IA (${model}):`, res.errorMsg);
        continue;
      }

      const parsed = parseModelJson(res.text);
      if (!parsed || typeof parsed.readable !== "boolean") {
        console.error(`KYC IA (${model}): respuesta sin formato JSON esperado`);
        continue;
      }

      const rawName =
        typeof parsed.name === "string" ? parsed.name.replace(/\s+/g, " ").trim() : null;
      const nameIsValid = Boolean(rawName && rawName.length >= 3);
      const readable = parsed.readable === true && nameIsValid;

      return {
        readable,
        documentType:
          typeof parsed.documentType === "string"
            ? parsed.documentType.slice(0, 30)
            : null,
        name: readable && rawName ? rawName.slice(0, 200) : null,
        idNumber:
          typeof parsed.idNumber === "string" && parsed.idNumber.trim()
            ? parsed.idNumber.trim().slice(0, 40)
            : null,
      };
    } catch (error) {
      console.error(`KYC IA (${model}) error:`, error);
    }
  }

  return null;
}
