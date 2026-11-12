/**
 * Lectura automática del nombre en documentos KYC con Gemini (visión).
 * IMPORTANTE: solo LEE el nombre y lo devuelve — la aprobación del documento
 * sigue siendo manual del admin. Si Gemini falla o está desactivado, devuelve
 * null y todo sigue como siempre (revisión a ojo).
 *
 * Se puede apagar con KYC_AI_READ="off" en las variables de entorno.
 * Usa el cliente compartido src/lib/gemini.ts (cascada + reintentos).
 */

import { callGeminiJson } from "@/lib/gemini";

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

  const result = await callGeminiJson<Partial<ExtractedDocumentInfo>>({
    prompt: PROMPT,
    attachment: { mimeType: match[1].toLowerCase(), data: match[2] },
    temperature: 0,
    maxOutputTokens: 400,
    json: true,
    timeoutMs: 8000,
  });

  if (!result.ok || !result.data || typeof result.data.readable !== "boolean") {
    if (!result.ok) console.error("KYC IA:", result.error);
    else console.error("KYC IA: respuesta sin formato JSON esperado");
    return null;
  }

  const parsed = result.data;
  const rawName =
    typeof parsed.name === "string" ? parsed.name.replace(/\s+/g, " ").trim() : null;
  const nameIsValid = Boolean(rawName && rawName.length >= 3);
  const readable = parsed.readable === true && nameIsValid;

  return {
    readable,
    documentType:
      typeof parsed.documentType === "string" ? parsed.documentType.slice(0, 30) : null,
    name: readable && rawName ? rawName.slice(0, 200) : null,
    idNumber:
      typeof parsed.idNumber === "string" && parsed.idNumber.trim()
        ? parsed.idNumber.trim().slice(0, 40)
        : null,
  };
}
