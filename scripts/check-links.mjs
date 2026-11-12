/**
 * Checker de enlaces muertos (hubiera detectado el bug de nexus-impertodo).
 * - Revisa todos los <a href> de la página principal (externos e internos)
 * - Revisa los demoUrl que sirve /api/github (deployments de los proyectos)
 * - Revisa el sitemap
 * Reporta a la GitHub Step Summary y avisa por Telegram si hay fallos.
 * Uso: SITE_URL=https://caskiuz.vercel.app node scripts/check-links.mjs
 */

const SITE = (process.env.SITE_URL || "https://caskiuz.vercel.app").replace(/\/$/, "");
const TIMEOUT_MS = 15000;

async function checkUrl(url, depth = 0) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    let res = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: ctrl.signal,
      headers: { "User-Agent": "caskiuz-link-checker/1.0" },
    });
    clearTimeout(t);
    // Algunos servidores rechazan HEAD: reintenta con GET
    if (res.status === 405 || res.status === 403 || res.status === 501) {
      const ctrl2 = new AbortController();
      const t2 = setTimeout(() => ctrl2.abort(), TIMEOUT_MS);
      res = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: ctrl2.signal,
        headers: { "User-Agent": "caskiuz-link-checker/1.0" },
      });
      clearTimeout(t2);
      // no leak: cierra el body
      try { await res.body?.cancel(); } catch {}
    }
    return { url, status: res.status, ok: res.status < 400 };
  } catch (error) {
    // Un reintento amable antes de darlo por muerto
    if (depth === 0) {
      await new Promise((r) => setTimeout(r, 1500));
      return checkUrl(url, 1);
    }
    return { url, status: 0, ok: false, error: error?.message || "network error" };
  }
}

async function collectLinks() {
  const links = new Set();

  // 1) Sitemap (rutas oficiales)
  try {
    const res = await fetch(`${SITE}/sitemap.xml`);
    const xml = await res.text();
    for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) links.add(m[1]);
  } catch {
    console.error("No se pudo leer el sitemap");
  }

  // 2) Enlaces del HTML de la home
  try {
    const res = await fetch(SITE);
    const html = await res.text();
    for (const m of html.matchAll(/href="(https?:\/\/[^"]+)"/g)) {
      // Omite enlaces obvios de share/brand que no deben bloquear
      links.add(m[1]);
    }
  } catch {
    console.error("No se pudo leer la home");
  }

  // 3) demoUrl de los proyectos (la fuente del bug de nexus-impertodo)
  try {
    const res = await fetch(`${SITE}/api/github`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : data.projects || [];
    for (const p of list) {
      if (p?.demoUrl && /^https?:\/\//.test(p.demoUrl)) links.add(p.demoUrl);
    }
  } catch {
    console.error("No se pudo leer /api/github");
  }

  return [...links];
}

async function main() {
  console.log(`🔗 Chequeando enlaces de ${SITE}...`);
  const links = await collectLinks();
  console.log(`   ${links.length} enlaces únicos`);

  // Concurrency moderada para no levantar sospechas de robots
  const results = [];
  const queue = [...links];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const url = queue.shift();
      const result = await checkUrl(url);
      results.push(result);
      process.stdout.write(result.ok ? "." : "✗");
    }
  });
  await Promise.all(workers);
  console.log("");

  const failures = results.filter((r) => !r.ok);
  const summary = failures.length
    ? failures.map((f) => `- ${f.url} → ${f.status || "sin respuesta"}${f.error ? ` (${f.error})` : ""}`).join("\n")
    : null;

  console.log(
    failures.length
      ? `❌ ${failures.length} enlaces caídos:\n${summary}`
      : "✅ Todos los enlaces responden"
  );

  // GitHub Step Summary
  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import("node:fs");
    const md = failures.length
      ? `# 🔗 Link checker — ${failures.length} caídos\n\n${summary
          .split("\n")
          .map((l) => l.replace(/^- /, "- ❌ "))
          .join("\n")}`
      : `# 🔗 Link checker\n\n✅ ${links.length} enlaces revisados, todos OK.`;
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  }

  // Telegram si hay fallos
  if (failures.length && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text:
            `🔗 <b>Link checker: ${failures.length} enlace(s) caído(s)</b> en ${SITE}\n\n` +
            failures.map((f) => `• ${f.url} → ${f.status || "sin respuesta"}`).slice(0, 20).join("\n"),
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
        signal: AbortSignal.timeout(10000),
      });
    } catch (e) {
      console.error("No se pudo avisar por Telegram:", e.message);
    }
  }

  process.exit(0); // informativo: el fallo se ve en el summary y Telegram
}

main();
