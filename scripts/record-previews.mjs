/**
 * Graba una vista previa (mp4 + póster jpg) de cada proyecto con web en vivo.
 *
 *   npm run previews              → graba todos los proyectos
 *   npm run previews -- --only=rifasv2
 *
 * Requiere una vez: npx playwright install chromium
 *
 * Salidas:
 *   public/previews/{slug}.mp4
 *   public/previews/{slug}.jpg
 *   src/lib/previews.json   (manifest que consume la sección de proyectos)
 */
import { mkdir, readFile, writeFile, stat, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "previews");
const manifestPath = path.join(root, "src", "lib", "previews.json");
const tmpDir = path.join(os.tmpdir(), "caskiuz-previews");

const VIEWPORT = { width: 1280, height: 800 };
const API_URL = process.env.PREVIEWS_API_URL || "https://caskiuz.vercel.app/api/github";
const ONLY = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];

// Repos excluidos del portfolio (mantener en sync con src/components/sections/projects.tsx).
const HIDDEN = ["caskiuzdev", "dymb", "cobrogest-pro"];

// Proyectos sin repo público: mismos enlaces que en projects.tsx.
const MANUAL = [
  { slug: "comeya", url: "https://comeya.es" },
  { slug: "beefinder", url: "https://beefinder.net" },
  { slug: "highpower", url: "https://highpowercoinproject.vercel.app" },
  { slug: "astrobar", url: "https://astro-bar-app.vercel.app" },
];

const slugify = (value) =>
  value
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

const normalize = (url) => url.replace(/\/+$/, "");

async function demoProjects() {
  const byUrl = new Map();
  for (const item of MANUAL) byUrl.set(normalize(item.url), item);

  try {
    const res = await fetch(API_URL, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const repos = await res.json();
    for (const repo of repos) {
      if (repo.fork || !repo.demoUrl || HIDDEN.includes(repo.name)) continue;
      const url = normalize(repo.demoUrl);
      if (!byUrl.has(url)) byUrl.set(url, { slug: slugify(repo.name), url });
    }
    console.log(`Proyectos desde ${API_URL}: ${repos.length} repos`);
  } catch (error) {
    console.warn(`No se pudo leer ${API_URL} (${error.message}); se graban solo los manuales.`);
  }

  let projects = [...byUrl.values()];
  if (ONLY) projects = projects.filter((p) => p.slug === ONLY);
  return projects;
}

async function loadManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, "utf8"));
  } catch {
    return {};
  }
}

/** Graba ~6 s ya cargado el sitio: animación de entrada, recorrido y pausa final. */
const BLOCKED_PAGE =
  /just a moment|attention required|access denied|checking your browser|verifying you are human|error 403|error 404|page not found|not found/i;

async function record(browser, { slug, url }) {
  const webm = path.join(tmpDir, `${slug}.webm`);
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: "es-ES",
    ignoreHTTPSErrors: true,
    recordVideo: { dir: tmpDir, size: VIEWPORT },
  });

  const page = await context.newPage();
  const startedAt = Date.now();
  let trim;

  try {
    const response = await page.goto(url, { waitUntil: "load", timeout: 45000 });
    if ((response?.status() ?? 200) >= 400) {
      throw new Error(`la web respondió HTTP ${response.status()}`);
    }

    // La grabación empieza al crear la página: esperamos a que pinte de verdad
    // y recortamos ese arranque para que el vídeo (y el póster) no salgan en blanco.
    await page
      .waitForFunction(() => (document.body?.innerText ?? "").trim().length > 80, { timeout: 20000 })
      .catch(() => {});
    const title = await page.title();
    const text = (await page.evaluate(() => document.body?.innerText ?? "")).trim();
    if (text.length < 80) throw new Error("la página no mostró contenido");
    if (BLOCKED_PAGE.test(`${title} ${text.slice(0, 400)}`)) {
      throw new Error(`página bloqueada o no válida ("${title}")`);
    }
    trim = (Date.now() - startedAt) / 1000 + 0.4;

    await page.waitForTimeout(2000); // animaciones de entrada

    // Recorrido de ~3 s en tiempo real (los timers se retrasan en webs pesadas).
    await Promise.race([
      page.evaluate(async () => {
        const start = performance.now();
        const duration = 3000;
        const distance = Math.min(
          window.innerHeight * 0.8,
          Math.max(0, document.body.scrollHeight - window.innerHeight)
        );
        while (performance.now() - start < duration) {
          const progress = Math.min(1, (performance.now() - start) / duration);
          window.scrollTo({ top: distance * progress });
          await new Promise((resolve) => setTimeout(resolve, 40));
        }
      }),
      page.waitForTimeout(10000),
    ]);
    await page.waitForTimeout(1200);

    if ((Date.now() - startedAt) / 1000 - trim < 3) {
      throw new Error("no se pudo grabar suficiente contenido");
    }
  } finally {
    const video = page.video();
    await context.close(); // finaliza el .webm
    const recorded = video ? await video.path() : null;
    if (recorded && existsSync(recorded)) {
      const { rename } = await import("node:fs/promises");
      await rm(webm, { force: true });
      await rename(recorded, webm);
    }
  }

  return { webm, trim };
}

async function convert(ffmpeg, slug, webm, trim) {
  const mp4 = path.join(outDir, `${slug}.mp4`);
  const poster = path.join(outDir, `${slug}.jpg`);
  await execFileAsync(ffmpeg, [
    "-y", "-i", webm, "-ss", trim.toFixed(2),
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "30",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart",
    mp4,
  ]);
  await execFileAsync(ffmpeg, [
    "-y", "-i", mp4, "-ss", "0.6", "-frames:v", "1", "-q:v", "4", poster,
  ]);
  return { mp4, poster };
}

async function main() {
  const { default: ffmpeg } = await import("ffmpeg-static");
  const { chromium } = await import("playwright");

  await mkdir(outDir, { recursive: true });
  await mkdir(tmpDir, { recursive: true });

  const projects = await demoProjects();
  if (projects.length === 0) {
    console.error(ONLY ? `No hay proyecto con slug "${ONLY}".` : "No hay proyectos con demo en vivo.");
    process.exit(1);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch (error) {
    console.error(
      `No se pudo iniciar Chromium (${error.message}).\nEjecuta una vez: npx playwright install chromium`
    );
    process.exit(1);
  }

  const manifest = await loadManifest();
  let ok = 0;

  for (const project of projects) {
    process.stdout.write(`· ${project.slug} (${project.url}) ... `);
    try {
      const { webm, trim } = await record(browser, project);
      const { mp4, poster } = await convert(ffmpeg, project.slug, webm, trim);
      const { size } = await stat(mp4);
      await stat(poster);
      manifest[normalize(project.url)] = {
        video: `/previews/${project.slug}.mp4`,
        poster: `/previews/${project.slug}.jpg`,
        recordedAt: new Date().toISOString().slice(0, 10),
      };
      ok++;
      console.log(`OK (${(size / 1024 / 1024).toFixed(2)} MB)`);
    } catch (error) {
      console.log(`FALLÓ: ${error.message}`);
    }
  }

  await browser.close();
  await rm(tmpDir, { recursive: true, force: true });

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  console.log(`\n${ok}/${projects.length} grabados. Manifest: src/lib/previews.json`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
