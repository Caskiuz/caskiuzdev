/**
 * Comparación de nombres para la revisión KYC (módulo puro: usable en cliente
 * y servidor). La IA solo LEE el nombre del documento; la aprobación sigue
 * siendo 100% manual del admin.
 */

const STOPWORDS = new Set([
  "de", "del", "la", "las", "los", "y", "da", "do", "dos", "van", "von",
]);

/** Convierte un nombre en tokens comparables: mayúsculas, sin acentos, sin partículas. */
export function normalizeNameTokens(name: string): string[] {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z\s]/g, " ")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token.toLowerCase()));
}

/**
 * true si el nombre leído en el documento coincide con el registrado:
 * - al menos 2 tokens en común, y
 * - todos los tokens del nombre más corto están presentes en el más largo.
 * Cubre orden distinto (apellidos primero), y que uno de los dos traiga
 * nombres o apellidos adicionales.
 */
export function namesMatch(
  registeredName: string,
  extractedName: string | null | undefined
): boolean {
  if (!extractedName) return false;
  const a = normalizeNameTokens(registeredName);
  const b = normalizeNameTokens(extractedName);
  if (a.length < 2 || b.length < 2) return false;

  const [shorter, longer] = a.length <= b.length ? [a, b] : [b, a];
  const longerSet = new Set(longer);
  const allPresent = shorter.every((token) => longerSet.has(token));
  return allPresent && shorter.filter((t) => longerSet.has(t)).length >= 2;
}
