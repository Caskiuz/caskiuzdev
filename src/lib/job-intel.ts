/**
 * Inteligencia del hub de empleo: recolecta vacantes de las fuentes gratis,
 * las pre-filtra por rol y las puntúa con IA contra el perfil del candidato.
 * También genera cartas de presentación adaptadas.
 */

import { prisma } from "@/lib/prisma/client";
import { callAI } from "@/lib/ai-router";
import { extractJson, checkAndIncrementAiQuota } from "@/lib/gemini";
import { candidateProfile, profilePromptBlock } from "@/lib/candidate-profile";
import { fetchAllJobSources, type JobSourceItem } from "@/lib/job-sources";

export interface JobCollectStats {
  fetched: number;
  fresh: number;
  scored: number;
  inserted: number;
  error?: string;
}

const ESCAPED = candidateProfile.roleKeywords
  .map((k) => k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
  .join("|");
const ROLE_RE = new RegExp(ESCAPED, "i");
const BLOCKLIST_RE =
  /\b(sales rep|sales representative|call center|telemarketing|customer service|receptionist|driver|chofer|nurse|enfermer|accountant|contador|teacher|profesor|barista|cleaner|limpieza)\b/i;

function isRelevant(job: JobSourceItem): boolean {
  const haystack = `${job.title} ${(job.description || "").slice(0, 900)}`;
  if (BLOCKLIST_RE.test(job.title)) return false;
  return ROLE_RE.test(haystack);
}

const SCORE_SYSTEM = `Eres un evaluador experto de vacantes para el candidato descrito. Evalúa el MATCH entre la vacante y el perfil.

Devuelve SOLO JSON válido: {"score": 0, "reasons": "", "salaryUsd": null}

Reglas:
- score 0-100: 85+ = encaja perfecto (stack, seniority, remoto, salario); 55-84 = encaja con matices; <55 = no conviene.
- Penaliza: presencial/no-remoto para LatAm, salario claramente bajo (<$1500/mes equivalente), stack muy ajeno, roles no técnicos, idiomas requeridos que el candidato no domina.
- Premia: stack JS/TS/React/Next/Node o Python/Django/FastAPI, automatización/IA, full-stack, remoto LatAm-friendly, salario ≥ $1500/mes.
- reasons: 1-2 frases justificando el score (para el panel del candidato).
- salaryUsd: salario mensual estimado en USD si se puede inferir; null si no.

${profilePromptBlock()}`;

async function scoreJobWithAI(job: JobSourceItem): Promise<{ score: number; reasons: string } | null> {
  if (!(await checkAndIncrementAiQuota("JOB"))) return null;
  const result = await callAI({
    system: SCORE_SYSTEM,
    prompt: `VACANTE:
Título: ${job.title}
Empresa: ${job.company}
Ubicación: ${job.location || "Remoto"}
Salario: ${job.salaryText || "no indicado"}
Descripción: ${(job.description || "").slice(0, 1800)}`,
    temperature: 0.2,
    maxOutputTokens: 400,
    lite: true,
    json: true,
    timeoutMs: 30000,
  });
  if (!result.ok) return null;
  const data = extractJson<{ score?: number; reasons?: string; salaryUsd?: number | null }>(result.text);
  if (!data) return null;
  const score = Math.max(0, Math.min(100, Math.round(Number(data.score) || 0)));
  const reasons = typeof data.reasons === "string" ? data.reasons.trim().slice(0, 600) : "";
  return { score, reasons };
}

/**
 * Recolecta → pre-filtra → puntúa (máx `maxScore` por corrida) → guarda
 * solo las que superan el umbral. Devuelve estadísticas para el digest.
 */
export async function collectAndScoreJobs(opts?: { maxScore?: number; minScore?: number }): Promise<JobCollectStats> {
  const maxScore = opts?.maxScore ?? 12;
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
  const fresh = unique.filter((j) => !seen.has(`${j.source}|${j.externalId}`) && isRelevant(j));

  const toScore = fresh.slice(0, maxScore);
  let scored = 0;
  let inserted = 0;

  for (const job of toScore) {
    const intel = await scoreJobWithAI(job);
    if (!intel) break; // cuota agotada o IA caída: se reintenta mañana
    scored++;
    if (intel.score < minScore) continue;
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
          score: intel.score,
          matchReasons: intel.reasons,
          status: "NEW",
        },
      });
      inserted++;
    } catch {
      // duplicado por carrera: se ignora
    }
  }

  return { fetched: items.length, fresh: fresh.length, scored, inserted };
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
