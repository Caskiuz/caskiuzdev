"use client";

import { useSyncExternalStore } from "react";

export const REFERRAL_CODE_COOKIE = "cask_ref_code";

/** Lee el código de referido de la cookie legible (solo en el navegador) */
export function getReferralCodeFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)cask_ref_code=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

const emptySubscribe = () => () => {};

/**
 * Devuelve el código de referido del visitante (si llegó por el link de un
 * afiliado). Usa useSyncExternalStore para leer la cookie sin provocar
 * desajustes de hidratación (en servidor devuelve null).
 */
export function useReferralCode(): string | null {
  return useSyncExternalStore(
    emptySubscribe,
    getReferralCodeFromCookie,
    () => null
  );
}

/**
 * Enriquce un mensaje de WhatsApp con el código de referido del visitante,
 * de modo que el afiliado reciba el crédito aunque el cliente escriba por
 * WhatsApp en lugar del formulario.
 */
export function appendReferralCode(message: string, code: string | null): string {
  if (!code) return message;
  return `${message}\n\nCódigo de referido: ${code}`;
}
