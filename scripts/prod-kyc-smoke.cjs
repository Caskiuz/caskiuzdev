/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Smoke test KYC en producción + relleno de la lectura IA para documentos
 * pendientes subidos antes del deploy (p. ej. el de Yenifer).
 * Uso: node scripts/prod-kyc-smoke.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const PROD = "https://caskiuz.vercel.app";
const EMAIL = "tmp-kyc-prod@example.com";
const PASSWORD = "TestKyc12345";
const CEDULA = "C:/Users/rijar/Downloads/WhatsApp Image 2026-10-09 at 2.09.44 PM.jpeg";

const results = [];
function assert(cond, name, detail) {
  results.push(`${cond ? "✅" : "❌"} ${name}${cond ? "" : `: ${detail || "falló"}`}`);
  if (!cond) console.error(`FAIL ${name}: ${detail}`);
}
function getCookie(headers, name) {
  for (const h of headers) {
    if (h.startsWith(name + "=")) return h.split(";")[0].slice(name.length + 1);
  }
  return null;
}

let baselineNotifId = 0;

async function backfillPendingNames() {
  console.log("\n📖 Rellenando nombres IA para documentos pendientes sin lectura…");
  const pending = await prisma.affiliateDocument.findMany({
    where: { status: "PENDING", extractedName: null },
    select: { id: true, affiliateId: true, fileData: true, fileName: true },
  });
  if (pending.length === 0) {
    console.log("No hay documentos pendientes sin lectura.");
    return;
  }
  // Reutiliza EXACTAMENTE el prompt del módulo de producción
  const source = fs.readFileSync(path.resolve(__dirname, "..", "src", "lib", "kyc-ai.ts"), "utf8");
  const promptMatch = source.match(/const PROMPT = `([\s\S]*?)`;/);
  if (!promptMatch) throw new Error("No se encontró el PROMPT en kyc-ai.ts");
  const prompt = promptMatch[1];
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Sin GEMINI_API_KEY");

  for (const doc of pending) {
    const m = /^data:((?:image\/[a-z0-9.+-]+)|(?:application\/pdf));base64,(.+)$/i.exec(doc.fileData);
    if (!m) {
      console.log(`doc #${doc.id} (${doc.fileName}): formato no soportado`);
      continue;
    }
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ inlineData: { mimeType: m[1].toLowerCase(), data: m[2] } }, { text: prompt }] }],
            generationConfig: { temperature: 0, maxOutputTokens: 400, responseMimeType: "application/json", thinkingConfig: { thinkingBudget: 0 } },
          }),
          signal: controller.signal,
        }
      );
      clearTimeout(timer);
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      const clean = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      const parsed = start >= 0 && end > start ? JSON.parse(clean.slice(start, end + 1)) : null;
      if (parsed?.readable === true && typeof parsed.name === "string" && parsed.name.trim().length >= 3) {
        const name = parsed.name.replace(/\s+/g, " ").trim().slice(0, 200);
        await prisma.affiliateDocument.update({ where: { id: doc.id }, data: { extractedName: name } });
        console.log(`doc #${doc.id} (afiliado #${doc.affiliateId}): IA leyó «${name}»`);
      } else {
        console.log(`doc #${doc.id} (afiliado #${doc.affiliateId}): la IA no pudo leer el nombre`);
      }
    } catch (error) {
      console.log(`doc #${doc.id}: error → ${error.message}`);
    }
  }
}

async function cleanup(tempId) {
  console.log("\n🧹 Limpiando datos de prueba en producción…");
  if (tempId) {
    await prisma.notification.deleteMany({ where: { recipientId: tempId } }).catch(() => {});
  }
  await prisma.notification.deleteMany({ where: { recipientType: "ADMIN", title: { contains: "Prueba KYC Prod" } } }).catch(() => {});
  const del = await prisma.affiliate.deleteMany({ where: { email: EMAIL } }).catch(() => ({ count: 0 }));
  console.log(`afiliado temporal eliminado: ${del.count}`);
}

async function main() {
  const maxNotif = await prisma.notification.aggregate({ _max: { id: true } });
  baselineNotifId = maxNotif._max.id ?? 0;
  await prisma.affiliate.deleteMany({ where: { email: EMAIL } });

  // 1) Registro del afiliado temporal en PRODUCCIÓN
  const reg = await fetch(`${PROD}/api/affiliate/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Prueba KYC Prod", email: EMAIL, password: PASSWORD, country: "Venezuela", acceptsTerms: true }),
  });
  assert(reg.status === 201, "registro en producción", `status=${reg.status}`);
  const affToken = getCookie(reg.headers.getSetCookie ? reg.headers.getSetCookie() : [], "affiliate_token");
  assert(Boolean(affToken), "sesión de afiliado obtenida", "sin cookie");
  const temp = await prisma.affiliate.findUnique({ where: { email: EMAIL }, select: { id: true } });
  assert(Boolean(temp), "afiliado temporal en BD", "no existe");

  // 2) Subida de la cédula: la respuesta debe llegar RÁPIDO (sin esperar a la IA)
  const cedulaData = "data:image/jpeg;base64," + fs.readFileSync(CEDULA).toString("base64");
  const t0 = Date.now();
  const up = await fetch(`${PROD}/api/affiliate/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `affiliate_token=${affToken}` },
    body: JSON.stringify({ type: "ID", fileName: "cedula-smoke.jpg", fileData: cedulaData }),
  });
  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  const upJson = await up.json().catch(() => ({}));
  assert(up.status === 201, "subida aceptada en producción", `status=${up.status} ${upJson?.error || ""}`);
  assert(Number(elapsed) < 15, `respuesta rápida (${elapsed}s < 15s)`, `${elapsed}s`);

  // 3) Lectura IA en segundo plano
  let doc = null;
  for (let i = 0; i < 20; i++) {
    doc = await prisma.affiliateDocument.findUnique({ where: { id: upJson.document.id }, select: { id: true, extractedName: true } });
    if (doc?.extractedName) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const extracted = doc?.extractedName || "";
  assert(/ARMAS/i.test(extracted) && /LEDEZMA/i.test(extracted), "IA leyó ARMAS LEDEZMA en producción", extracted);

  // 4) Aviso al admin + badge en la pantalla de revisión
  const adminNotif = await prisma.notification.count({
    where: { recipientType: "ADMIN", kind: "KYC", title: { contains: "Prueba KYC Prod" } },
  });
  assert(adminNotif >= 1, "aviso al admin del documento nuevo", `count=${adminNotif}`);

  const loginRes = await fetch(`${PROD}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  const adminToken = getCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [], "admin_token");
  const pageRes = await fetch(`${PROD}/admin/affiliates/${temp.id}`, { headers: { Cookie: `admin_token=${adminToken}` } });
  const pageText = await pageRes.text();
  assert(pageRes.status === 200 && pageText.includes("La IA leyó en la foto"), "la revisión muestra la lectura IA", `status=${pageRes.status}`);
  assert(pageText.includes("NO coincide con"), "marca NO coincide (nombre de prueba distinto)", "texto no encontrado");

  // 5) Decisión manual del admin (rechazo, como parte del flujo)
  const reject = await fetch(`${PROD}/api/admin/documents/${upJson.document.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({ status: "REJECTED", notes: "Prueba automática de producción." }),
  });
  assert(reject.status === 200, "decisión manual del admin en producción", `status=${reject.status}`);

  await cleanup(temp.id);

  // 6) Relleno para documentos pendientes anteriores al deploy
  await backfillPendingNames();

  console.log("\n────────── RESULTADOS ──────────");
  results.forEach((r) => console.log(r));
  const failed = results.filter((r) => r.startsWith("❌")).length;
  console.log(`\n${failed === 0 ? "🎉 SMOKE DE PRODUCCIÓN COMPLETO" : `⚠️ ${failed} fallaron`}`);
  await prisma.$disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async (error) => {
  console.error("\n💥 Error:", error);
  await cleanup(null);
  await prisma.$disconnect();
  process.exit(1);
});
