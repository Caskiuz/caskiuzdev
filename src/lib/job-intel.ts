/**
 * Inteligencia del hub de empleo: recolecta vacantes de las fuentes gratis,
 * las pre-filtra por rol y las puntúa con IA contra el perfil del candidato.
 * También genera cartas de presentación adaptadas.
 */

import { prisma } from "@/lib/prisma/client";
import { callAI } from "@/lib/ai-router";
import { extractJson, checkAndIncrementAiQuota, getAiUsageToday } from "@/lib/gemini";
import { candidateProfile, profilePromptBlock } from "@/lib/candidate-profile";
import { fetchAllJobSources, type JobSourceItem } from "@/lib/job-sources";

export interface JobCollectStats {
  fetched: number;
  fresh: number;
  scored: number;
  inserted: number;
  /** Cuántas vacantes aportó cada fuente (diagnóstico del hub). */
  bySource?: Record<string, number>;
  error?: string;
}

const ESCAPED = candidateProfile.roleKeywords
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const ROLE_RE = new RegExp(ESCAPED, "i");
const ROLE_TITLE_RE =
  /(full.?stack|front.?end|back.?end|react|next\.?js|node|typescript|javascript|python|django|fastapi|automation|automatiz|ai engineer|llm|chatbot|software engineer|developer|desarrollador)/i;
const BLOCKLIST_RE =
  /\b(sales rep|sales representative|call center|telemarketing|customer service|receptionist|driver|chofer|nurse|enfermer|accountant|contador|teacher|profesor|barista|cleaner|limpieza)\b/i;

function isRelevant(job: JobSourceItem): boolean {
  const haystack = `${job.title} ${(job.description || "").slice(0, 900)}`;
  if (BLOCKLIST_RE.test(job.title)) return false;
  return ROLE_RE.test(haystack);
}

/** Ordena las vacantes frescas para puntuar primero las que más encajan. */
function jobPriority(job: JobSourceItem): number {
  let score = 0;
  if (job.remote) score += 20;
  if (ROLE_TITLE_RE.test(job.title)) score += 30;
  if ((job.salaryMin ?? 0) >= 1500) score += 20;
  if (/^(REMOTIVE|HIMALAYAS|JOBICY|WWR|WORKINGNOMADS|HN)$/.test(job.source)) score += 10;
  if (/latam|anywhere|worldwide|global|south america|venezuela|colombia/i.test(`${job.location || ""} `)) {
    score += 15;
  }
  if (/senior|lead|principal/i.test(job.title)) score += 5;
  return score;
}

const SCORE_SYSTEM = `Eres un evaluador experto de vacantes para el candidato descrito. Evalúa el MATCH entre cada vacante y el perfil.

Devuelve SOLO JSON válido: {"items":[{"i":0,"score":0,"reasons":"","salaryUsd":null}]}

Reglas:
- score 0-100: 85+ = encaja perfecto (stack, seniority, remoto, salario); 55-84 = encaja con matices; <55 = no conviene.
- Penaliza: presencial/no-remoto para LatAm, salario claramente bajo (<$1500/mes equivalente), stack muy ajeno, roles no técnicos, idiomas requeridos que el candidato no domina.
- Premia: stack JS/TS/React/Next/Node o Python/Django/FastAPI, automatización/IA, full-stack, remoto LatAm-friendly, salario ≥ $1500/mes.
- reasons: 1 frase justificando el score, MÁXIMO 15 palabras (para el panel del candidato).
- Evalúa TODAS las vacantes numeradas y devuelve un item por cada una, con su índice "i".

${profilePromptBlock()}`;

interface JobScore {
  score: number;
  reasons: string;
}

/**
 * Puntúa hasta 8 vacantes en UNA sola llamada de IA (misma cuota que una
 * individual) para multiplicar el volumen del hub sin gastar más free tier.
 * Devuelve null si la cuota está agotada o la IA no responde.
 */
async function scoreJobsBatchWithAI(jobs: JobSourceItem[]): Promise<(JobScore | null)[] | null> {
  if (!jobs.length) return [];
  // Pre-vuelo sin cobrar: si el lote falla (proveedor caído/JSON roto), no
  // quema cuota. Se incrementa solo cuando la respuesta se parsea bien.
  const used = await getAiUsageToday("JOB");
  if (used >= 40) return null;

  const listing = jobs
    .map(
      (job, i) =>
        `${i}. TÍTULO: ${job.title}\nEMPRESA: ${job.company}\nUBICACIÓN: ${job.location || "Remoto"}\nSALARIO: ${job.salaryText || "no indicado"}\nDESCRIPCIÓN: ${(job.description || "").slice(0, 700)}`
    )
    .join("\n\n");

  const result = await callAI({
    system: SCORE_SYSTEM,
    prompt: `VACANTES:\n\n${listing}\n\nResponde con el JSON pedido, un item por vacante.`,
    temperature: 0.2,
    maxOutputTokens: 3000,
    lite: true,
    json: true,
    timeoutMs: 40000,
  });
  if (!result.ok) {
    console.error("Scoring por lote falló:", result.provider, result.error);
    return null;
  }

  const data = extractJson<{
    items?: { i?: number; score?: number; reasons?: string }[];
  }>(result.text);
  if (!data?.items?.length) {
    console.error("Scoring por lote: respuesta sin JSON válido", result.text.slice(0, 200));
    return null;
  }

  const out: (JobScore | null)[] = new Array(jobs.length).fill(null);
  for (const item of data.items) {
    const idx = Number(item.i);
    if (!Number.isInteger(idx) || idx < 0 || idx >= jobs.length) continue;
    out[idx] = {
      score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
      reasons:
        typeof item.reasons === "string" ? item.reasons.trim().slice(0, 600) : "",
    };
  }
  if (!out.some(Boolean)) return null;
  await checkAndIncrementAiQuota("JOB");
  return out;
}

/** Respaldo cuando el lote falla: puntúa una sola vacante con prompt corto. */
async function scoreSingleJob(job: JobSourceItem): Promise<JobScore | null> {
  const used = await getAiUsageToday("JOB");
  if (used >= 40) return null;
  const result = await callAI({
    system: SCORE_SYSTEM,
    prompt: `VACANTE:
Título: ${job.title}
Empresa: ${job.company}
Ubicación: ${job.location || "Remoto"}
Salario: ${job.salaryText || "no indicado"}
Descripción: ${(job.description || "").slice(0, 1200)}

Responde con {"items":[{"i":0,"score":0,"reasons":""}]}.`,
    temperature: 0.2,
    maxOutputTokens: 800,
    lite: true,
    json: true,
    timeoutMs: 30000,
  });
  if (!result.ok) {
    console.error("Scoring individual falló:", result.provider, result.error);
    return null;
  }
  const data = extractJson<{ items?: { score?: number; reasons?: string }[] }>(result.text);
  const item = data?.items?.[0];
  if (!item) {
    console.error("Scoring individual sin JSON:", result.text.slice(0, 150));
    return null;
  }
  await checkAndIncrementAiQuota("JOB");
  return {
    score: Math.max(0, Math.min(100, Math.round(Number(item.score) || 0))),
    reasons: typeof item.reasons === "string" ? item.reasons.trim().slice(0, 600) : "",
  };
}

/**
 * Recolecta → pre-filtra → puntúa en lotes (máx `maxScore` por corrida) →
 * guarda solo las que superan el umbral. Devuelve estadísticas para el digest.
 */
export async function collectAndScoreJobs(opts?: { maxScore?: number; minScore?: number }): Promise<JobCollectStats> {
  const maxScore = opts?.maxScore ?? 24;
  const minScore = opts?.minScore ?? 55;

  const items = await fetchAllJobSources();
  if (!items.length) {
    return { fetched: 0, fresh: 0, scored: 0, inserted: 0, error: "Las fuentes no devolvieron vacantes" };
  }

  // Dedupe interno + contra lo ya guardado
  const inMemory = new Set<string>();
  const unique = items.filter((j) => {
    const key = `${j.source}|${j.externalId}`;
    if (inMemory.has(key)) return false;
    inMemory.add(key);
    return true;
  });
  const existing = await prisma.jobOpportunity
    .findMany({ select: { source: true, externalId: true } })
    .catch(() => []);
  const seen = new Set(existing.map((e) => `${e.source}|${e.externalId}`));
  const fresh = unique
    .filter((j) => !seen.has(`${j.source}|${j.externalId}`) && isRelevant(j))
    // Solo remoto: el candidato está en Venezuela; presencial no es aplicable.
    .filter(
      (j) =>
        j.remote ||
        /remot|anywhere|latam|worldwide|global|venezuela|colombia/i.test(
          `${j.location || ""} ${(j.description || "").slice(0, 400)}`
        )
    )
    .sort((a, b) => jobPriority(b) - jobPriority(a));
  const bySource: Record<string, number> = {};
  for (const j of unique) bySource[j.source] = (bySource[j.source] || 0) + 1;

  const toScore = fresh.slice(0, maxScore);
  let scored = 0;
  let inserted = 0;

  // Lotes de 5: 16 vacantes = 4 llamadas de IA, con salida holgada para que
  // el JSON nunca se corte (el fallo típico era truncamiento del lote de 8).
  for (let i = 0; i < toScore.length; i += 5) {
    const batch = toScore.slice(i, i + 5);
    let intel = await scoreJobsBatchWithAI(batch);
    if (!intel) {
      // Respaldo: puntúa de a una hasta 2 para no perder la corrida
      intel = new Array(batch.length).fill(null);
      for (let k = 0; k < Math.min(2, batch.length); k++) {
        intel[k] = await scoreSingleJob(batch[k]);
      }
      if (!intel.some(Boolean)) break;
    }
    for (let j = 0; j < batch.length; j++) {
      const result = intel[j];
      if (!result) continue;
      scored++;
      if (result.score < minScore) continue;
      const job = batch[j];
      try {
        await prisma.jobOpportunity.create({
          data: {
            source: job.source,
            externalId: job.externalId.slice(0, 200),
            title: job.title.slice(0, 250),
            company: job.company.slice(0, 200),
            url: job.url.slice(0, 600),
            location: job.location?.slice(0, 150) ?? null,
            remote: job.remote,
            salaryText: job.salaryText?.slice(0, 200) ?? null,
            salaryMin: job.salaryMin ?? null,
            description: job.description?.slice(0, 2000) ?? null,
            score: result.score,
            matchReasons: result.reasons,
            status: "NEW",
          },
        });
        inserted++;
      } catch {
        // duplicado por carrera: se ignora
      }
    }
  }

  return { fetched: items.length, fresh: fresh.length, scored, inserted, bySource };
}

const DRAFT_SYSTEM = `Eres el asistente de postulaciones del candidato descrito. Escribe una carta de presentación en ESPAÑOL (250-320 palabras) para la vacante dada.

Reglas:
- Tono profesional, directo y humano; nada de frases genéricas de relleno.
- Menciona 2-3 proyectos o logros REALES del perfil que encajen con la vacante (con sus URLs si aporta).
- Muestra dominio del stack pedido en la vacante.
- Cierra con disponibilidad inmediata y disposición a una llamada.
- Devuelve SOLO el texto de la carta, sin asunto ni encabezados.

${profilePromptBlock()}`;

export async function draftJobApplication(jobId: number): Promise<string | null> {
  const job = await prisma.jobOpportunity.findUnique({ where: { id: jobId } });
  if (!job) return null;
  if (!(await checkAndIncrementAiQuota("JOB"))) return null;

  const result = await callAI({
    system: DRAFT_SYSTEM,
    prompt: `VACANTE:
Título: ${job.title}
Empresa: ${job.company}
Ubicación: ${job.location || "Remoto"}
Salario: ${job.salaryText || "no indicado"}
Descripción: ${(job.description || "").slice(0, 2200)}`,
    temperature: 0.6,
    maxOutputTokens: 900,
    timeoutMs: 40000,
  });
  if (!result.ok) return null;
  const letter = result.text.trim().slice(0, 4000);
  await prisma.jobOpportunity.update({ where: { id: jobId }, data: { draftLetter: letter } });
  return letter;
}
