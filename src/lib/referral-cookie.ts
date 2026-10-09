"use client";

import { useSyncExternalStore } from "react";

export const REFERRAL_CODE_COOKIE = "cask_ref_code";

/** Vigencia del código guardado en localStorage (igual que la cookie: 30 días). */
export const REFERRAL_TTL_DAYS = 30;
const LS_KEY = "cask_ref_code";
const LS_AT_KEY = "cask_ref_code_at";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notify() {
  listeners.forEach((listener) => listener());
}

/** Lee la cookie legible (solo en el navegador). */
function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)cask_ref_code=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Lee el código guardado en localStorage (con vencimiento de 30 días). */
function readLocalStorage(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const at = Number(window.localStorage.getItem(LS_AT_KEY) || 0);
    if (!at || Date.now() - at > REFERRAL_TTL_DAYS * 24 * 3600 * 1000) return null;
    return window.localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

/** Guarda el código en cookie JS + localStorage y avisa a los suscriptores. */
export function saveReferralCode(code: string): void {
  try {
    if (typeof document === "undefined") return;
    const clean = code.trim().slice(0, 60);
    if (!clean) return;
    document.cookie = `cask_ref_code=${encodeURIComponent(clean)}; max-age=${
      REFERRAL_TTL_DAYS * 24 * 3600
    }; path=/; SameSite=Lax`;
    window.localStorage.setItem(LS_KEY, clean);
    window.localStorage.setItem(LS_AT_KEY, String(Date.now()));
    notify();
  } catch {
    // almacenamiento bloqueado: la atribución sigue viva en la URL (?ref=)
  }
}

/** Si la cookie se borró pero localStorage conserva el código, la restaura. */
export function restoreReferralFromStorage(): void {
  const cookie = readCookie();
  const stored = readLocalStorage();
  if (!cookie && stored) saveReferralCode(stored);
}

/** Código de referido en el parámetro ?ref= de la URL actual. */
export function getReferralCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const ref = new URLSearchParams(window.location.search).get("ref");
  return ref ? ref.trim().slice(0, 60) : null;
}

/** Código del visitante: cookie → localStorage (para sobrevivir a cookies borradas). */
export function getReferralCodeFromCookie(): string | null {
  return readCookie() || readLocalStorage();
}

/**
 * Devuelve el código de referido del visitante (si llegó por el link de un
 * afiliado). Usa useSyncExternalStore para leer la cookie/localStorage sin
 * provocar desajustes de hidratación (en servidor devuelve null).
 */
export function useReferralCode(): string | null {
  return useSyncExternalStore(
    subscribe,
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
