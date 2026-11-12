/**
 * Notificaciones push por Telegram (Bot API, 100% gratis e ilimitado).
 * El bot se crea en 2 minutos con @BotFather y las credenciales van en
 * TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID. Sin configurar, todo es no-op.
 */

const TELEGRAM_API = (token: string) => `https://api.telegram.org/bot${token}/sendMessage`;

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

/** Envía un mensaje (HTML básico). Nunca lanza: degrada en silencio. */
export async function sendTelegramMessage(text: string): Promise<boolean> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return false;

  try {
    const res = await fetch(TELEGRAM_API(token), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch (error) {
    console.error("Error enviando mensaje de Telegram:", error);
    return false;
  }
}

/** Escapa texto plano para parse_mode HTML. */
export function escapeTelegramHtml(text: string): string {
  return text.replace(/[&<>]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string
  );
}
