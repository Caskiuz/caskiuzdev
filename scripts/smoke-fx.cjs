/**
 * Smoke test de la capa inmersiva (Fase A) contra el servidor local.
 * Verifica: carga sin errores JS, lenis activo, cursor fx, barra de progreso,
 * marquee, wizard de contacto en 3 pasos, modo sin efectos, chat IA presente.
 * Uso: BASE_URL=http://localhost:3100 node scripts/smoke-fx.cjs
 */
const { chromium } = require("playwright");

const BASE = process.env.BASE_URL || "http://localhost:3100";
let failures = 0;
function check(name, ok, extra = "") {
  console.log(`${ok ? "✅" : "❌"} ${name}${extra ? " — " + extra : ""}`);
  if (!ok) failures++;
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const jsErrors = [];
  page.on("pageerror", (e) => jsErrors.push(String(e).slice(0, 160)));

  await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2500);

  // 1) Sin errores JS
  check("Sin errores JS", jsErrors.length === 0, jsErrors.join(" | "));

  // 2) Lenis activo (clase html.lenis-smooth)
  const lenisOn = await page.evaluate(() =>
    document.documentElement.classList.contains("lenis-smooth") ||
    Boolean(window.__lenis)
  );
  check("Lenis smooth scroll activo", lenisOn);

  // 3) Elementos de la capa FX
  check("Cursor dot presente", await page.locator(".fx-cursor-dot").count() === 1);
  check("Cursor ring presente", await page.locator(".fx-cursor-ring").count() === 1);
  check("Glow reactivo presente", await page.locator(".fx-mouse-glow").count() === 1);
  check("Barra progreso presente", await page.locator("div.fixed.top-0.z-\\[70\\]").count() >= 1);
  check("Marquee presente", await page.locator(".fx-marquee").count() === 1);

  // 4) Contador animado terminó en valor final (3+)
  const stat1 = await page.locator("section#home .metal-card p").first().textContent();
  check("Contador stats animado", /3\+/.test(stat1 || ""), stat1 || "");

  // 5) Scroll con lenis funciona (wheel + anchor)
  await page.evaluate(() => window.__lenis?.scrollTo("#services", { offset: -68 }));
  await page.waitForTimeout(1200);
  const servicesTop = await page.evaluate(() => {
    const el = document.getElementById("services");
    return el ? el.getBoundingClientRect().top : -1;
  });
  // offset -68 => la sección queda a 68px del borde superior (bajo el header fijo)
  check("Lenis scrollTo #services alinea bajo header", servicesTop >= 40 && servicesTop <= 100, `top=${Math.round(servicesTop)}`);

  // 6) Tabs de categorías siguen funcionando (click cambia contenido)
  const tabBtn = page.locator("button", { hasText: "Redes" }).first();
  const tabVisible = (await tabBtn.count()) > 0;
  if (tabVisible) {
    await tabBtn.click();
    await page.waitForTimeout(600);
    const heading = await page.locator("#services h3").first().textContent();
    check("Tab Redes cambia contenido", /Redes/i.test(heading || ""));
  } else {
    check("Tab Redes encontrada", false);
  }

  // 7) Wizard de contacto: paso 1 chips
  await page.evaluate(() => window.__lenis?.scrollTo("#contact", { offset: -68 }));
  await page.waitForTimeout(900);
  const chip = page.locator("#contact button", { hasText: "Automatización & IA" }).first();
  check("Wizard paso 1 visible", (await chip.count()) === 1);
  await chip.click();
  await page.waitForTimeout(400);
  const contBtn = page.locator("#contact button", { hasText: "Continuar" }).first();
  await contBtn.click();
  await page.waitForTimeout(400);
  const budget = page.locator("#contact button", { hasText: "$200 – $500" }).first();
  check("Wizard paso 2 presupuesto", (await budget.count()) === 1);
  await budget.click();
  await page.locator("#contact button", { hasText: "Continuar" }).first().click();
  await page.waitForTimeout(400);
  const honeypot = await page.locator('#contact input[name="website"]').count();
  check("Wizard paso 3 datos + honeypot", honeypot === 1);

  // 8) Chat IA flotante presente
  check("Chat IA flotante", (await page.locator('button[aria-label="Abrir asistente de IA"]').count()) === 1);

  // 9) Toggle modo sin efectos en footer
  const fxToggle = page.locator("footer button", { hasText: "Modo sin efectos" });
  check("Toggle efectos en footer", (await fxToggle.count()) === 1);
  await fxToggle.click();
  await page.waitForTimeout(900);
  const effectsOff = await page.evaluate(() => document.body.classList.contains("effects-off"));
  check("Modo sin efectos activa clase", effectsOff);
  const lenisAfter = await page.evaluate(() => !window.__lenis);
  check("Modo sin efectos destruye lenis", lenisAfter);
  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("footer button")].find((b) =>
      /Activar efectos/.test(b.textContent || "")
    );
    btn?.click();
  });
  await page.waitForTimeout(700);
  const lenisBack = await page.evaluate(() => Boolean(window.__lenis));
  check("Reactivar efectos restaura lenis", lenisBack);

  // 10) Página de blog muestra portadas IA
  await page.goto(BASE + "/blog", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  const covers = await page.evaluate(
    () => document.querySelectorAll('img[alt^="Portada:"]').length
  );
  check("Blog con portadas IA", covers >= 5, `${covers} portadas`);

  await browser.close();
  console.log(failures === 0 ? "\n🎉 TODO OK" : `\n⚠️ ${failures} fallos`);
  process.exit(failures === 0 ? 0 : 1);
})();
