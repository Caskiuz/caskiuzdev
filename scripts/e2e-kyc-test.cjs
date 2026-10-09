/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * E2E local del KYC: registro de afiliado temporal (API real) → subida de un
 * archivo que no es documento (IA: no legible) → rechazo manual → subida de la
 * cédula real (IA lee el nombre) → verificación de la coincidencia en la
 * pantalla de revisión → aprobación manual → notificación al afiliado.
 * Limpia TODO al final. Uso: node scripts/e2e-kyc-test.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const BASE = "http://localhost:3210";
const EMAIL = "tmp-kyc-test@example.com";
const PASSWORD = "TestKyc12345";
const NAME = "Carlos Alejandro De Armas Ledezma TEST";
const CEDULA = "C:/Users/rijar/Downloads/WhatsApp Image 2026-10-09 at 2.09.44 PM.jpeg";
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const results = [];
function assert(cond, name, detail) {
  results.push(`${cond ? "✅" : "❌"} ${name}${cond ? "" : `: ${detail || "falló"}`}`);
  if (!cond) console.error(`FAIL ${name}: ${detail}`);
}
function getCookie(setCookieHeaders, name) {
  for (const h of setCookieHeaders) {
    if (h.startsWith(name + "=")) return h.split(";")[0].slice(name.length + 1);
  }
  return null;
}

async function fetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { status: res.status, json, text, headers: res.headers };
}

let baselineNotifId = 0;
let baselineReady = false;

/** Reintenta operaciones de BD (Aiven a veces corta la conexión un instante). */
async function withRetry(fn, attempts = 4) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw lastError;
}

async function cleanup() {
  console.log("\n🧹 Limpiando datos de prueba…");
  const aff = await prisma.affiliate.findUnique({ where: { email: EMAIL } }).catch(() => null);
  if (aff) {
    await prisma.affiliateDocument.deleteMany({ where: { affiliateId: aff.id } }).catch(() => {});
  }
  // Solo se borran notificaciones si el baseline se capturó con seguridad:
  // nunca borrar a ciegas (podría llevarse notificaciones reales).
  let notifCount = 0;
  if (baselineReady) {
    const notif = await prisma.notification
      .deleteMany({ where: { id: { gt: baselineNotifId } } })
      .catch(() => ({ count: 0 }));
    notifCount = notif.count;
  } else {
    console.warn("⚠️ Baseline de notificaciones no capturado: NO se borran notificaciones (protección).");
  }
  const affDel = await prisma.affiliate.deleteMany({ where: { email: EMAIL } }).catch(() => ({ count: 0 }));
  console.log(`documentos y afiliado eliminados (aff=${affDel.count}) · notificaciones=${notifCount}`);
}

async function main() {
  const maxNotif = await withRetry(() => prisma.notification.aggregate({ _max: { id: true } }));
  baselineNotifId = maxNotif._max.id ?? 0;
  baselineReady = true;
  await withRetry(() => prisma.affiliate.deleteMany({ where: { email: EMAIL } }));

  // 1) Registro real del afiliado temporal
  const reg = await fetchJson(`${BASE}/api/affiliate/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: NAME,
      email: EMAIL,
      password: PASSWORD,
      country: "Venezuela",
      phone: "4120000000",
      acceptsTerms: true,
    }),
  });
  assert(reg.status === 201, "registro de afiliado temporal", `status=${reg.status} ${reg.json?.error || ""}`);
  const affiliate = await prisma.affiliate.findUnique({ where: { email: EMAIL } });
  assert(Boolean(affiliate), "afiliado existe en BD", "no encontrado");
  const regCookies = reg.headers.getSetCookie ? reg.headers.getSetCookie() : [];
  const affToken = getCookie(regCookies, "affiliate_token");
  assert(Boolean(affToken), "cookie de sesión tras registro", "sin cookie");

  // 2) Subida de un archivo que NO es un documento → la IA no puede leer nombre
  const up1 = await fetchJson(`${BASE}/api/affiliate/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `affiliate_token=${affToken}` },
    body: JSON.stringify({ type: "ID", fileName: "no-documento.png", fileData: TINY_PNG }),
  });
  assert(up1.status === 201, "subida 1 (archivo no documento) aceptada", `status=${up1.status} ${up1.json?.error || ""}`);
  const doc1 = await prisma.affiliateDocument.findUnique({ where: { id: up1.json.document.id } });
  assert(doc1.status === "PENDING", "subida 1 queda PENDING", doc1.status);
  assert(doc1.extractedName === null || doc1.extractedName === undefined, "IA no leyó nombre en un archivo que no es documento", String(doc1.extractedName));
  const notifAdmin1 = await prisma.notification.findFirst({
    where: {
      recipientType: "ADMIN",
      kind: "KYC",
      title: { contains: "De Armas Ledezma TEST" },
      createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) },
    },
    orderBy: { id: "desc" },
  });
  assert(Boolean(notifAdmin1), "aviso al admin del documento nuevo", "sin notificación");

  // 3) Admin rechaza manualmente la subida 1
  const loginRes = await fetchJson(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  const adminToken = getCookie(loginRes.headers.getSetCookie ? loginRes.headers.getSetCookie() : [], "admin_token");
  assert(Boolean(adminToken), "admin login", `status=${loginRes.status}`);

  const reject = await fetchJson(`${BASE}/api/admin/documents/${doc1.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({ status: "REJECTED", notes: "No es un documento de identidad (prueba automatizada)." }),
  });
  assert(reject.status === 200, "rechazo manual (subida 1)", `status=${reject.status}`);

  // 4) Subida de la cédula real → la IA debe leer el nombre
  const buf = fs.readFileSync(CEDULA);
  const cedulaData = "data:image/jpeg;base64," + buf.toString("base64");
  const up2 = await fetchJson(`${BASE}/api/affiliate/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `affiliate_token=${affToken}` },
    body: JSON.stringify({ type: "ID", fileName: "cedula.jpg", fileData: cedulaData }),
  });
  assert(up2.status === 201, "subida 2 (cédula real) aceptada", `status=${up2.status} ${up2.json?.error || ""}`);
  // La lectura IA corre en segundo plano tras la respuesta: esperar a que guarde el nombre
  let doc2 = await prisma.affiliateDocument.findUnique({ where: { id: up2.json.document.id } });
  for (let i = 0; i < 25 && !doc2.extractedName; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    doc2 = await prisma.affiliateDocument.findUnique({ where: { id: up2.json.document.id } });
  }
  const extracted = doc2.extractedName || "";
  assert(Boolean(extracted), "IA leyó un nombre en la cédula", String(extracted));
  assert(/ARMAS/i.test(extracted) && /LEDEZMA/i.test(extracted), "el nombre leído contiene ARMAS LEDEZMA", extracted);
  assert(/CARLOS/i.test(extracted), "el nombre leído contiene CARLOS", extracted);

  // 5) La pantalla de revisión del admin muestra la coincidencia
  const adminPage = await fetchJson(`${BASE}/admin/affiliates/${affiliate.id}`, {
    headers: { Cookie: `admin_token=${adminToken}` },
  });
  assert(adminPage.status === 200, "página del afiliado en admin carga", `status=${adminPage.status}`);
  assert(adminPage.text.includes("La IA leyó en la foto"), "la revisión muestra la lectura de la IA", "texto no encontrado");
  assert(adminPage.text.includes("Coincide con"), "la revisión marca que COINCIDE con el afiliado", "texto no encontrado");

  // 6) Aprobación manual → notificación al afiliado
  const approve = await fetchJson(`${BASE}/api/admin/documents/${doc2.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({ status: "APPROVED", notes: "Nombre verificado (prueba automatizada)." }),
  });
  assert(approve.status === 200, "aprobación manual (subida 2)", `status=${approve.status}`);
  const affNotif = await prisma.notification.findFirst({
    where: { recipientType: "AFFILIATE", recipientId: affiliate.id, kind: "KYC", title: { contains: "aprobado" } },
  });
  assert(Boolean(affNotif), "notificación de aprobación al afiliado", "sin notificación");

  // 7) El afiliado ve sus documentos
  const affDocs = await fetchJson(`${BASE}/api/affiliate/documents`, {
    headers: { Cookie: `affiliate_token=${affToken}` },
  });
  assert(affDocs.status === 200 && affDocs.json.length === 2, "el afiliado ve sus 2 documentos", `status=${affDocs.status}, n=${affDocs.json?.length}`);
  assert(affDocs.json[0].status === "APPROVED", "el más reciente está aprobado", affDocs.json[0]?.status);
}

main()
  .then(async () => {
    console.log("\n────────── RESULTADOS ──────────");
    results.forEach((r) => console.log(r));
    const failed = results.filter((r) => r.startsWith("❌")).length;
    console.log(`\n${failed === 0 ? "🎉 TODOS PASARON" : `⚠️ ${failed} fallaron`}`);
    await cleanup();
    await prisma.$disconnect();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error("\n💥 Error:", error);
    await cleanup();
    await prisma.$disconnect();
    process.exit(1);
  });
