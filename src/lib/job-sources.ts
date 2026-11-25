/**
 * Recolector de vacantes de fuentes 100% gratuitas:
 * Remotive · RemoteOK · Himalayas · Jobicy · WeWorkRemotely (RSS)
 * y Torre (API, opcional: se activa si TORRE_API_KEY responde).
 *
 * Todas devuelven el mismo shape normalizado; cualquier fallo de una fuente
 * se ignora (Promise.allSettled) para que el hub nunca dependa de una sola.
 */

export interface JobSourceItem {
  source:
    | "REMOTIVE"
    | "REMOTEOK"
    | "HIMALAYAS"
    | "JOBICY"
    | "WWR"
    | "TORRE"
    | "ARBEITNOW"
    | "WORKINGNOMADS"
    | "HN";
  externalId: string;
  title: string;
  company: string;
  url: string;
  location?: string | null;
  remote: boolean;
  salaryText?: string | null;
  salaryMin?: number | null;
  description?: string | null;
}

const TIMEOUT_MS = 15000;

function stripHtml(html: string, maxLen = 2500): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen);
}

async function fetchJson<T>(url: string, headers: Record<string, string> = {}): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "caskiuz-jobhub/1.0 (https://caskiuz.vercel.app)", Accept: "application/json", ...headers },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ─── Remotive ───
interface RemotiveJob {
  id?: number;
  title?: string;
  company_name?: string;
  candidate_required_location?: string;
  salary?: string;
  url?: string;
  description?: string;
}

export async function fetchRemotive(): Promise<JobSourceItem[]> {
  const data = await fetchJson<{ jobs?: RemotiveJob[] }>(
    "https://remotive.com/api/remote-jobs?limit=60"
  );
  return (data?.jobs ?? [])
    .filter((j) => j.title && j.url)
    .map((j) => ({
      source: "REMOTIVE" as const,
      externalId: String(j.id ?? j.url),
      title: j.title!.slice(0, 250),
      company: (j.company_name || "—").slice(0, 200),
      url: j.url!,
      location: j.candidate_required_location || "Remoto",
      remote: true,
      salaryText: j.salary || null,
      description: j.description ? stripHtml(j.description) : null,
    }));
}

// ─── RemoteOK ───
interface RemoteOkJob {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  url?: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  description?: string;
  tags?: string[];
}

export async function fetchRemoteOK(): Promise<JobSourceItem[]> {
  const data = await fetchJson<(RemoteOkJob | { legal?: string })[]>("https://remoteok.com/api");
  if (!Array.isArray(data)) return [];
  return data
    .filter((j): j is RemoteOkJob => Boolean((j as RemoteOkJob).position))
    .map((j) => ({
      source: "REMOTEOK" as const,
      externalId: String(j.id ?? j.slug ?? j.url),
      title: j.position!.slice(0, 250),
      company: (j.company || "—").slice(0, 200),
      url: j.url || `https://remoteok.com/remote-jobs/${j.slug}`,
      location: j.location || "Remoto",
      remote: true,
      salaryText:
        j.salary_min && j.salary_max
          ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k/año`
          : null,
      salaryMin: j.salary_min ? Math.round(j.salary_min / 12) : null,
      description: j.description ? stripHtml(j.description) : (j.tags || []).join(", "),
    }));
}

// ─── Himalayas ───
interface HimalayasJob {
  guid?: string;
  title?: string;
  companyName?: string;
  applicationLink?: string;
  locationRestrictions?: string[];
  minSalary?: number;
  maxSalary?: number;
  description?: string;
  pubDate?: number;
}

export async function fetchHimalayas(): Promise<JobSourceItem[]> {
  const data = await fetchJson<{ jobs?: HimalayasJob[] }>(
    "https://himalayas.app/jobs/api?limit=50"
  );
  return (data?.jobs ?? [])
    .filter((j) => j.title && j.applicationLink)
    .map((j) => ({
      source: "HIMALAYAS" as const,
      externalId: String(j.guid ?? j.applicationLink),
      title: j.title!.slice(0, 250),
      company: (j.companyName || "—").slice(0, 200),
      url: j.applicationLink!,
      location: (j.locationRestrictions || ["Remoto"]).join(", ").slice(0, 150),
      remote: true,
      salaryText:
        j.minSalary && j.maxSalary
          ? `$${Math.round(j.minSalary / 1000)}k–$${Math.round(j.maxSalary / 1000)}k/año`
          : null,
      salaryMin: j.minSalary ? Math.round(j.minSalary / 12) : null,
      description: j.description ? stripHtml(j.description) : null,
    }));
}

// ─── Jobicy ───
interface JobicyJob {
  id?: number;
  jobTitle?: string;
  companyName?: string;
  url?: string;
  jobGeo?: string;
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  jobDescription?: string;
}

export async function fetchJobicy(): Promise<JobSourceItem[]> {
  const data = await fetchJson<{ jobs?: JobicyJob[] }>(
    "https://jobicy.com/api/v2/remote-jobs?count=50&geo=latam"
  );
  return (data?.jobs ?? [])
    .filter((j) => j.jobTitle && j.url)
    .map((j) => ({
      source: "JOBICY" as const,
      externalId: String(j.id ?? j.url),
      title: j.jobTitle!.slice(0, 250),
      company: (j.companyName || "—").slice(0, 200),
      url: j.url!,
      location: j.jobGeo || "Remoto",
      remote: true,
      salaryText:
        j.annualSalaryMin && j.annualSalaryMax
          ? `${j.annualSalaryMin}–${j.annualSalaryMax}/año`
          : null,
      description: j.jobDescription ? stripHtml(j.jobDescription) : null,
    }));
}

// ─── WeWorkRemotely RSS ───
export async function fetchWWR(): Promise<JobSourceItem[]> {
  try {
    const res = await fetch(
      "https://weworkremotely.com/categories/remote-programming-jobs.rss",
      {
        headers: { "User-Agent": "caskiuz-jobhub/1.0" },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, 40);
    return items
      .map((m) => {
        const block = m[1];
        const title = (/<title><!\[CDATA\[(.*?)\]\]><\/title>/.exec(block) || /<title>(.*?)<\/title>/.exec(block) || [])[1] || "";
        const link = (/<link>(.*?)<\/link>/.exec(block) || [])[1] || "";
        const desc = (/<description><!\[CDATA\[(.*?)\]\]><\/description>/.exec(block) || [])[1] || "";
        // WWR usa "Empresa: Puesto" en el título
        const [companyPart, ...rest] = title.split(":");
        const position = rest.length ? rest.join(":").trim() : title.trim();
        return {
          source: "WWR" as const,
          externalId: link || title,
          title: position.slice(0, 250),
          company: (rest.length ? companyPart.trim() : "—").slice(0, 200),
          url: link,
          location: "Remoto",
          remote: true,
          description: desc ? stripHtml(desc) : null,
        };
      })
      .filter((j) => j.title && j.url);
  } catch {
    return [];
  }
}

// ─── Torre (opcional) ───
interface TorreJob {
  id?: string;
  objective?: string;
  organizations?: { name?: string }[];
  canonicalPosition?: string;
  url?: string;
  locations?: string[];
  compensation?: { minAmount?: number; maxAmount?: number; currency?: string };
  description?: string;
  [key: string]: unknown;
}

export async function fetchTorreJobs(): Promise<JobSourceItem[]> {
  const key = process.env.TORRE_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch("https://api.torre.ai/v1/jobs/search?limit=50&offset=0", {
      headers: { Authorization: `Bearer ${key}`, Accept: "application/json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: TorreJob[] } | TorreJob[];
    const list = Array.isArray(data) ? data : data.results ?? [];
    return list
      .filter((j) => j.objective || j.canonicalPosition)
      .map((j) => ({
        source: "TORRE" as const,
        externalId: String(j.id ?? j.url ?? j.objective),
        title: String(j.objective || j.canonicalPosition).slice(0, 250),
        company: (j.organizations?.[0]?.name || "—").slice(0, 200),
        url: j.url || (j.id ? `https://torre.ai/post/${j.id}` : "https://torre.ai"),
        location: (j.locations || ["Remoto"]).join(", ").slice(0, 150),
        remote: true,
        salaryText:
          j.compensation?.minAmount
            ? `${j.compensation.currency || "USD"} ${j.compensation.minAmount}–${j.compensation.maxAmount || "?"}/mes`
            : null,
        salaryMin: j.compensation?.minAmount ?? null,
        description: j.description ? stripHtml(String(j.description)) : null,
      }));
  } catch {
    return [];
  }
}

// ─── Arbeitnow (gratis, sin key; sobre todo Europa remota) ───
interface ArbeitnowJob {
  slug?: string;
  company_name?: string;
  title?: string;
  description?: string;
  remote?: boolean;
  url?: string;
  location?: string;
  tags?: string[];
  job_types?: string[];
}

export async function fetchArbeitnow(): Promise<JobSourceItem[]> {
  const data = await fetchJson<{ data?: ArbeitnowJob[] }>(
    "https://www.arbeitnow.com/api/job-board-api"
  );
  return (data?.data ?? [])
    .filter(
      (j) =>
        j.title &&
        j.url &&
        (j.remote || /remote|remoto|anywhere|worldwide/i.test(`${j.title} ${j.location || ""}`))
    )
    .map((j) => ({
      source: "ARBEITNOW" as const,
      externalId: String(j.slug ?? j.url),
      title: j.title!.slice(0, 250),
      company: (j.company_name || "—").slice(0, 200),
      url: j.url!,
      location: j.location || (j.remote ? "Remoto" : "Europa"),
      remote: Boolean(j.remote) || /remote|remoto/i.test(`${j.location || ""} ${j.title || ""}`),
      description: j.description ? stripHtml(j.description) : (j.tags || []).join(", "),
    }));
}

// ─── Working Nomads (API pública, sin key) ───
interface WorkingNomadsJob {
  url?: string;
  title?: string;
  description?: string;
  company_name?: string;
  company?: string;
  category_name?: string;
  location?: string;
  tags?: string[];
}

export async function fetchWorkingNomads(): Promise<JobSourceItem[]> {
  const data = await fetchJson<WorkingNomadsJob[]>(
    "https://www.workingnomads.com/api/exposed_jobs/"
  );
  if (!Array.isArray(data)) return [];
  return data
    .filter((j) => j.title && j.url)
    .map((j) => ({
      source: "WORKINGNOMADS" as const,
      externalId: String(j.url),
      title: j.title!.slice(0, 250),
      company: (j.company_name || j.company || "—").slice(0, 200),
      url: j.url!,
      location: j.location || "Remoto",
      remote: true,
      description: j.description ? stripHtml(j.description) : (j.tags || []).join(", "),
    }));
}

// ─── Hacker News (Algolia, gratis y sin key) ───
interface HNHit {
  objectID?: string;
  comment_text?: string;
  title?: string;
  story_id?: number;
  parent_id?: number;
  created_at_i?: number;
}

function hnFirstLine(html: string): string {
  const withBreaks = html
    .replace(/<\/(p|div|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#\d+;/g, " ");
  const first =
    withBreaks
      .split("\n")
      .map((l) => l.replace(/\s+/g, " ").trim())
      .find((l) => l.length > 6) || "";
  return first.slice(0, 200);
}

/**
 * Hilo mensual "Ask HN: Who is hiring?" — cientos de empresas publican
 * vacantes con remoto. Es de los mejores lugares para enviar el CV.
 */
export async function fetchHNWhoIsHiring(): Promise<JobSourceItem[]> {
  const storySearch = await fetchJson<{ hits?: HNHit[] }>(
    `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(
      "Ask HN: Who is hiring?"
    )}&tags=story&hitsPerPage=10`
  );
  const cutoff = Math.floor(Date.now() / 1000) - 50 * 24 * 3600;
  const story = (storySearch?.hits ?? []).find(
    (h) =>
      /who is hiring/i.test(h.title || "") &&
      (h.created_at_i ?? 0) > cutoff &&
      h.objectID
  );
  if (!story?.objectID) return [];

  const comments = await fetchJson<{ hits?: HNHit[] }>(
    `https://hn.algolia.com/api/v1/search?tags=${encodeURIComponent(
      `comment,story_${story.objectID}`
    )}&hitsPerPage=100`
  );
  return (comments?.hits ?? [])
    .filter(
      (h) =>
        h.objectID &&
        h.comment_text &&
        String(h.parent_id) === String(story.objectID) &&
        !/^\s*(seeking work|seeking freelancer)/i.test(hnFirstLine(h.comment_text))
    )
    .map((h) => {
      const line = hnFirstLine(h.comment_text!);
      const company = (line.split("|")[0] || "—").trim().slice(0, 200);
      return {
        source: "HN" as const,
        externalId: String(h.objectID),
        title: line.slice(0, 250),
        company,
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        location: /remote|remoto|anywhere/i.test(h.comment_text!) ? "Remoto" : "Ver publicación",
        remote: /remote|remoto|anywhere/i.test(h.comment_text!),
        description: stripHtml(h.comment_text!, 3000),
      };
    });
}

/**
 * Hilo "SEEKING FREELANCER" (freelance gigs, se publica cada mes):
 * proyectos puntuales donde se responde por email o por el hilo.
 */
export async function fetchHNFreelance(): Promise<JobSourceItem[]> {
  const cutoff = Math.floor(Date.now() / 1000) - 21 * 24 * 3600;
  const data = await fetchJson<{ hits?: HNHit[] }>(
    `https://hn.algolia.com/api/v1/search_by_date?tags=comment&query=${encodeURIComponent(
      "SEEKING FREELANCER"
    )}&hitsPerPage=50&numericFilters=${encodeURIComponent(`created_at_i>${cutoff}`)}`
  );
  return (data?.hits ?? [])
    .filter((h) => h.objectID && h.comment_text && /seeking\s+freelancer/i.test(h.comment_text))
    .map((h) => {
      const line = hnFirstLine(h.comment_text!);
      return {
        source: "HN" as const,
        externalId: `freelance-${h.objectID}`,
        title: line.slice(0, 250),
        company: "HN · Freelance",
        url: `https://news.ycombinator.com/item?id=${h.objectID}`,
        location: /remote|remoto|anywhere/i.test(h.comment_text!) ? "Remoto" : "Ver publicación",
        remote: /remote|remoto|anywhere/i.test(h.comment_text!),
        description: stripHtml(h.comment_text!, 3000),
      };
    });
}

/** Recolecta todas las fuentes en paralelo (fallos aislados). */
export async function fetchAllJobSources(): Promise<JobSourceItem[]> {
  const results = await Promise.allSettled([
    fetchRemotive(),
    fetchRemoteOK(),
    fetchHimalayas(),
    fetchJobicy(),
    fetchWWR(),
    fetchTorreJobs(),
    fetchArbeitnow(),
    fetchWorkingNomads(),
    fetchHNFreelance(),
    fetchHNWhoIsHiring(),
  ]);
  const all: JobSourceItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }
  return all;
}
