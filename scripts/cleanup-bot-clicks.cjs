/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Limpieza de clics históricos de robots (una sola ejecución).
 *
 * Uso:
 *   node scripts/cleanup-bot-clicks.cjs          → REPORTE (no borra nada)
 *   node scripts/cleanup-bot-clicks.cjs --delete → borra los clics de robots
 *
 * Solo se borran clics cuyo User-Agent coincide con el patrón ESTRICTO de
 * crawlers (googlebot, facebookexternalhit, telegrambot, etc.). Los UA de
 * WhatsApp/Instagram NO se tocan: en el histórico no se puede distinguir la
 * vista previa del navegador interno de una persona real.
 */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const BOT_UA_PATTERN =
  /bot|crawler|spider|slurp|facebookexternalhit|telegrambot|twitterbot|linkedinbot|pinterest|discordbot|slackbot|headless|puppeteer|lighthouse|curl|wget|python-requests|okhttp|httpclient|googlebot|bingbot|duckduckbot|yandex|semrush|ahrefs|petalbot|applebot|baiduspider|scrapy|monitoring|archive\.org|ia_archiver/i;

async function main() {
  const shouldDelete = process.argv.includes("--delete");

  const clicks = await prisma.click.findMany({
    select: { id: true, userAgent: true, createdAt: true },
  });
  const botClicks = clicks.filter((c) => c.userAgent && BOT_UA_PATTERN.test(c.userAgent));
  const humanClicks = clicks.length - botClicks.length;

  const byMonth = {};
  for (const c of botClicks) {
    const key = c.createdAt.toISOString().slice(0, 7);
    byMonth[key] = (byMonth[key] || 0) + 1;
  }
  const sampleUas = [...new Set(botClicks.slice(0, 15).map((c) => c.userAgent))];

  console.log(`Total de clics en la BD: ${clicks.length}`);
  console.log(`Clics de robots (patrón estricto): ${botClicks.length}`);
  console.log(`Clics de personas: ${humanClicks}`);
  console.log(`Robots por mes: ${JSON.stringify(byMonth, null, 2)}`);
  console.log(`Ejemplos de UA de robot: ${JSON.stringify(sampleUas, null, 2)}`);

  if (!shouldDelete) {
    console.log("\n[REPORTE] No se borró nada. Ejecuta con --delete para limpiar.");
    return;
  }

  const ids = botClicks.map((c) => c.id);
  const result = await prisma.click.deleteMany({ where: { id: { in: ids } } });
  console.log(`\nBorrados ${result.count} clics de robots.`);
}

main()
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
