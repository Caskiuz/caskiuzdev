/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Test E2E del sistema de clics/leads (requiere el dev server en http://localhost:3210).
 * Uso: node scripts/e2e-tracking-test.cjs
 * Crea afiliados/leads de prueba y limpia TODO al final (aunque falle).
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");

const prisma = new PrismaClient();
const BASE = "http://localhost:3210";

const UA_HUMAN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TestBrowser/1.0 Safari/537.36";
const ACCEPT_HTML =
  "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8";
const IP = "8.8.4.4";
const SLUG_A = "test-tmp-aff";
const CODE_A = "TMPX9Y7Z";
const SLUG_B = "test-tmp-b";
const CODE_B = "TMPB8X6Z";

let affiliateAId = null;
let affiliateBId = null;
let baselineNotifId = 0;
const results = [];
const createdContactIds = [];

function pass(name) {
  results.push(`✅ ${name}`);
}
function fail(name, detail) {
  results.push(`❌ ${name}: ${detail}`);
  console.error(`FAIL ${name}: ${detail}`);
}

function assert(cond, name, detail) {
  if (cond) pass(name);
  else fail(name, detail || "condición no cumplida");
}

function getCookie(setCookieHeaders, name) {
  for (const h of setCookieHeaders) {
    if (h.startsWith(name + "=")) {
      return h.split(";")[0].slice(name.length + 1);
    }
  }
  return null;
}

function b64url(buf) {
  return Buffer.from(buf).toString("base64url");
}

function mintAffiliateToken(affiliateId) {
  const secret = process.env.AUTH_SECRET || process.env.ADMIN_PASSWORD || "fallback-secret";
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url(
    JSON.stringify({ role: "affiliate", sub: String(affiliateId), iat: now, exp: now + 3600 })
  );
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${header}.${payload}`)
    .digest("base64url");
  return `${header}.${payload}.${sig}`;
}

async function fetchJson(url, options = {}, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, options);
      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }
      return { status: res.status, json, headers: res.headers, text };
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error("unreachable");
}

async function cleanup() {
  console.log("\n🧹 Limpiando datos de prueba…");
  const contactRes = await prisma.contact.deleteMany({
    where: { email: { startsWith: "tracking-test-" } },
  });
  const saleRes = await prisma.sale.deleteMany({
    where: { serviceTitle: { startsWith: "Servicio test tracking" } },
  });
  const notifRes = await prisma.notification.deleteMany({ where: { id: { gt: baselineNotifId } } });
  const affRes = await prisma.affiliate.deleteMany({
    where: { slug: { in: [SLUG_A, SLUG_B] } },
  });
  const clickLeft = await prisma.click.count({
    where: {
      affiliateId: { in: [affiliateAId, affiliateBId].filter(Boolean) },
    },
  });
  console.log(
    `contactos: ${contactRes.count} · ventas: ${saleRes.count} · notificaciones: ${notifRes.count} · afiliados: ${affRes.count} · clics restantes: ${clickLeft}`
  );
}

async function main() {
  // Baselines y limpieza de restos de ejecuciones fallidas previas
  const notifMax = await prisma.notification.aggregate({ _max: { id: true } });
  baselineNotifId = notifMax._max.id ?? 0;
  await prisma.contact.deleteMany({ where: { email: { startsWith: "tracking-test-" } } });
  await prisma.affiliate.deleteMany({ where: { slug: { in: [SLUG_A, SLUG_B] } } });

  // Afiliados de prueba
  const affA = await prisma.affiliate.create({
    data: {
      email: "tracking-test-a@example.com",
      passwordHash: "test",
      name: "Test Tracking A",
      country: "Venezuela",
      status: "ACTIVE",
      tier: "SILVER",
      referralCode: CODE_A,
      slug: SLUG_A,
    },
  });
  const affB = await prisma.affiliate.create({
    data: {
      email: "tracking-test-b@example.com",
      passwordHash: "test",
      name: "Test Tracking B",
      country: "Venezuela",
      status: "ACTIVE",
      tier: "SILVER",
      referralCode: CODE_B,
      slug: SLUG_B,
    },
  });
  affiliateAId = affA.id;
  affiliateBId = affB.id;
  pass(`afiliados de prueba creados (A=${affA.id}, B=${affB.id})`);

  const clickCountA = () =>
    prisma.click.count({ where: { affiliateId: affA.id } });

  // 1) Bot por User-Agent (facebookexternalhit)
  let res = await fetchJson(`${BASE}/r/${SLUG_A}`, {
    redirect: "manual",
    headers: { "User-Agent": "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)" },
  });
  assert(res.status >= 300 && res.status < 400, "bot facebookexternalhit redirige", `status=${res.status}`);
  assert((await clickCountA()) === 0, "bot facebookexternalhit NO crea clic", `clicks=${await clickCountA()}`);

  // 2) Bot por cabecera purpose: preview
  res = await fetchJson(`${BASE}/r/${SLUG_A}`, {
    redirect: "manual",
    headers: { "User-Agent": UA_HUMAN, Purpose: "preview" },
  });
  assert((await clickCountA()) === 0, "purpose:preview NO crea clic", `clicks=${await clickCountA()}`);

  // 3) Bot por Accept sin text/html (vista previa de WhatsApp)
  res = await fetchJson(`${BASE}/r/${SLUG_A}`, {
    redirect: "manual",
    headers: { "User-Agent": "WhatsApp/2.24.1 A", Accept: "image/*" },
  });
  assert((await clickCountA()) === 0, "Accept sin text/html NO crea clic", `clicks=${await clickCountA()}`);

  // 4) Clic humano real
  res = await fetchJson(`${BASE}/r/${SLUG_A}?subid=local-test`, {
    redirect: "manual",
    headers: { "User-Agent": UA_HUMAN, Accept: ACCEPT_HTML, "X-Forwarded-For": IP },
  });
  const setCookies4 = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const caskRef = getCookie(setCookies4, "cask_ref");
  const caskRefCode = getCookie(setCookies4, "cask_ref_code");
  const caskVisit = getCookie(setCookies4, "cask_visit");
  const location4 = res.headers.get("location") || "";
  assert(res.status >= 300 && res.status < 400, "clic humano redirige", `status=${res.status}`);
  assert(Boolean(caskRef), "cookie cask_ref fijada", String(caskRef));
  assert(caskRefCode === SLUG_A, "cookie cask_ref_code = slug", String(caskRefCode));
  assert(Boolean(caskVisit), "cookie cask_visit fijada", String(caskVisit));
  assert(location4.includes(`ref=${SLUG_A}`), "redirect lleva ?ref=<slug> en la URL", location4);
  assert((await clickCountA()) === 1, "clic humano crea 1 clic", `clicks=${await clickCountA()}`);

  const clickRow = await prisma.click.findFirst({ where: { affiliateId: affA.id } });
  assert(clickRow.subId === "local-test", "subId guardado", clickRow.subId);
  assert(clickRow.ip === IP, "IP guardada", String(clickRow.ip));
  const clickId4 = clickRow.id;

  // 5) Dedup 24h: mismo visitante re-clica el mismo link
  res = await fetchJson(`${BASE}/r/${SLUG_A}`, {
    redirect: "manual",
    headers: { "User-Agent": UA_HUMAN, Accept: ACCEPT_HTML, "X-Forwarded-For": IP, Cookie: `cask_visit=${caskVisit}` },
  });
  assert((await clickCountA()) === 1, "re-clic del mismo visitante en 24h NO duplica", `clicks=${await clickCountA()}`);

  // 6) /wa/ fija cookies de atribución y registra clic whatsapp
  res = await fetchJson(`${BASE}/wa/${SLUG_A}`, {
    redirect: "manual",
    headers: { "User-Agent": UA_HUMAN, Accept: ACCEPT_HTML, "X-Forwarded-For": IP },
  });
  const setCookies6 = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  assert(Boolean(getCookie(setCookies6, "cask_ref")), "/wa fija cask_ref", "sin cookie");
  assert(
    getCookie(setCookies6, "cask_ref_code") === SLUG_A,
    "/wa fija cask_ref_code",
    String(getCookie(setCookies6, "cask_ref_code"))
  );
  const waClicks = await prisma.click.count({
    where: { affiliateId: affA.id, destination: "whatsapp" },
  });
  assert(waClicks === 1, "/wa registra 1 clic de whatsapp", `clicks=${waClicks}`);

  // 7) Atribución por cookie httpOnly
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `cask_ref=${affA.id}:${clickId4}` },
    body: JSON.stringify({
      name: "Tracking Test Cookie",
      email: "tracking-test-cookie@example.com",
      message: "prueba atribución por cookie",
    }),
  });
  assert(res.status === 201, "contacto por cookie aceptado", `status=${res.status}`);
  let contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === affA.id, "atribución COOKIE", `source=${contact.attributionSource}`);
  assert(contact.attributionSource === "COOKIE", "attributionSource=COOKIE", String(contact.attributionSource));
  const convertedClick = await prisma.click.findUnique({ where: { id: clickId4 } });
  assert(Boolean(convertedClick.convertedAt), "clic marcado convertido", String(convertedClick.convertedAt));
  const affNotif = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affA.id, kind: "NEW_LEAD" },
  });
  const adminNotif = await prisma.notification.count({
    where: { recipientType: "ADMIN", kind: "NEW_LEAD", title: { contains: "Tracking Test Cookie" } },
  });
  assert(affNotif >= 1, "notificación NEW_LEAD al afiliado", `count=${affNotif}`);
  assert(adminNotif >= 1, "notificación NEW_LEAD al admin", `count=${adminNotif}`);

  // 8) Atribución por código escrito: slug y código legado
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tracking Test Code",
      email: "tracking-test-code@example.com",
      message: "prueba código escrito",
      refCode: SLUG_A,
    }),
  });
  contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === affA.id && contact.attributionSource === "CODE", "atribución por SLUG escrito", String(contact.attributionSource));

  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tracking Test Code2",
      email: "tracking-test-code2@example.com",
      message: "prueba código legado",
      refCode: "tmpx9y7z",
    }),
  });
  contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === affA.id && contact.attributionSource === "CODE", "atribución por CÓDIGO legado escrito", String(contact.attributionSource));

  // 9) Atribución por ?ref= en la URL
  res = await fetchJson(`${BASE}/api/contact?ref=${SLUG_A}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Tracking Test Url",
      email: "tracking-test-url@example.com",
      message: "prueba ref en url",
    }),
  });
  contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === affA.id && contact.attributionSource === "URL", "atribución por ?ref=", String(contact.attributionSource));

  // 10) Rescate IP+UA inequívoco (todos los clics de esa IP son de A)
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA_HUMAN, "X-Forwarded-For": IP },
    body: JSON.stringify({
      name: "Tracking Test Ip",
      email: "tracking-test-ip@example.com",
      message: "prueba rescate ip",
    }),
  });
  contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === affA.id && contact.attributionSource === "IP_MATCH", "rescate IP+UA inequívoco", `source=${contact.attributionSource}, aff=${contact.affiliateId}`);

  // 11) Rescate IP+UA ambiguo: clic de B con la misma IP+UA → no adivina
  await fetchJson(`${BASE}/r/${SLUG_B}`, {
    redirect: "manual",
    headers: { "User-Agent": UA_HUMAN, Accept: ACCEPT_HTML, "X-Forwarded-For": IP },
  });
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA_HUMAN, "X-Forwarded-For": IP },
    body: JSON.stringify({
      name: "Tracking Test Amb",
      email: "tracking-test-amb@example.com",
      message: "prueba ip ambigua",
    }),
  });
  contact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(contact.id);
  assert(contact.affiliateId === null, "IP ambigua NO adivina (lead sin afiliado)", `aff=${contact.affiliateId}`);
  const ambContactId = contact.id;

  // 12) Admin login
  res = await fetchJson(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: process.env.ADMIN_PASSWORD }),
  });
  assert(res.status === 200, "admin login ok", `status=${res.status}`);
  const adminSetCookies = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
  const adminToken = getCookie(adminSetCookies, "admin_token");
  assert(Boolean(adminToken), "cookie admin_token obtenida", String(adminToken));

  // 13) Venta desde lead sin afiliado → auto-atribución + avisos
  res = await fetchJson(`${BASE}/api/admin/sales`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({
      affiliateId: affA.id,
      contactId: ambContactId,
      serviceTitle: "Servicio test tracking",
      amount: 100,
      status: "LEAD",
    }),
  });
  assert(res.status === 201, "venta desde lead sin afiliado creada", `status=${res.status}, err=${res.json?.error || ""}`);
  contact = await prisma.contact.findUnique({ where: { id: ambContactId } });
  assert(contact.affiliateId === affA.id && contact.attributionSource === "MANUAL", "venta auto-atribuye el lead", `aff=${contact.affiliateId}, source=${contact.attributionSource}`);
  const leadAssignedNotif = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affA.id, kind: "LEAD_ASSIGNED" },
  });
  const saleNotif = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affA.id, kind: "SALE" },
  });
  assert(leadAssignedNotif >= 1, "notificación LEAD_ASSIGNED al afiliado", `count=${leadAssignedNotif}`);
  assert(saleNotif >= 1, "notificación SALE al afiliado", `count=${saleNotif}`);

  // 14) Asignación manual desde el admin (PATCH contacts/[id])
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NoSignalTestUA/1.0" },
    body: JSON.stringify({
      name: "Tracking Test Manual",
      email: "tracking-test-manual@example.com",
      message: "lead para asignar a mano",
    }),
  });
  const manualContact = await prisma.contact.findUnique({ where: { id: res.json.id } });
  createdContactIds.push(manualContact.id);
  assert(manualContact.affiliateId === null, "lead sin señales queda sin afiliado", String(manualContact.affiliateId));

  res = await fetchJson(`${BASE}/api/admin/contacts/${manualContact.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({ affiliateId: affB.id }),
  });
  assert(res.status === 200, "asignación manual ok", `status=${res.status}, err=${res.json?.error || ""}`);
  contact = await prisma.contact.findUnique({ where: { id: manualContact.id } });
  assert(contact.affiliateId === affB.id && contact.attributionSource === "MANUAL", "lead asignado a B", `aff=${contact.affiliateId}, source=${contact.attributionSource}`);
  const bAssigned = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affB.id, kind: "LEAD_ASSIGNED" },
  });
  assert(bAssigned >= 1, "notificación de asignación a B", `count=${bAssigned}`);

  // 15) Páginas y endpoints de lectura de notificaciones
  const affToken = mintAffiliateToken(affA.id);
  res = await fetchJson(`${BASE}/afiliados/panel/notificaciones`, {
    headers: { Cookie: `affiliate_token=${affToken}` },
  });
  assert(res.status === 200 && res.text.includes("Notificaciones"), "página de notificaciones del afiliado renderiza", `status=${res.status}`);

  const affNotifs = await prisma.notification.findMany({
    where: { recipientType: "AFFILIATE", recipientId: affA.id, read: false },
    select: { id: true },
  });
  res = await fetchJson(`${BASE}/api/affiliate/notifications/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `affiliate_token=${affToken}` },
    body: JSON.stringify({ ids: affNotifs.map((n) => n.id) }),
  });
  assert(res.status === 200 && res.json.marked >= 1, "afiliado marca notificaciones leídas", `marked=${res.json?.marked}`);
  const unreadLeft = await prisma.notification.count({
    where: { recipientType: "AFFILIATE", recipientId: affA.id, read: false },
  });
  assert(unreadLeft === 0, "badge del afiliado queda en 0", `unread=${unreadLeft}`);

  res = await fetchJson(`${BASE}/admin/notificaciones`, {
    headers: { Cookie: `admin_token=${adminToken}` },
  });
  assert(res.status === 200 && res.text.includes("Notificaciones"), "página de notificaciones del admin renderiza", `status=${res.status}`);

  const adminNotifs = await prisma.notification.findMany({
    where: { recipientType: "ADMIN", read: false },
    select: { id: true },
  });
  res = await fetchJson(`${BASE}/api/admin/notifications/read`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `admin_token=${adminToken}` },
    body: JSON.stringify({ ids: adminNotifs.map((n) => n.id) }),
  });
  assert(res.status === 200 && res.json.marked >= 1, "admin marca notificaciones leídas", `marked=${res.json?.marked}`);

  // 16) Inbox del admin muestra el estado de afiliado
  res = await fetchJson(`${BASE}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "NoSignalTestUA/2.0" },
    body: JSON.stringify({
      name: "Tracking Test Inbox",
      email: "tracking-test-inbox@example.com",
      message: "lead para probar el inbox",
    }),
  });
  createdContactIds.push(res.json.id);
  res = await fetchJson(`${BASE}/admin/messages`, {
    headers: { Cookie: `admin_token=${adminToken}` },
  });
  assert(
    res.status === 200 && res.text.includes("Tracking Test Inbox") && res.text.includes("Sin afiliado"),
    "inbox muestra el lead y la etiqueta Sin afiliado",
    `status=${res.status}`
  );
}

main()
  .then(async () => {
    console.log("\n────────── RESULTADOS ──────────");
    results.forEach((r) => console.log(r));
    const failed = results.filter((r) => r.startsWith("❌")).length;
    console.log(`\n${failed === 0 ? "🎉 TODOS LOS TESTS PASARON" : `⚠️ ${failed} tests fallaron`}`);
    await cleanup();
    await prisma.$disconnect();
    process.exit(failed === 0 ? 0 : 1);
  })
  .catch(async (error) => {
    console.error("\n💥 Error en el test:", error);
    await cleanup();
    await prisma.$disconnect();
    process.exit(1);
  });
