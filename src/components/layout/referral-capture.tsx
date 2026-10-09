"use client";

import { useEffect } from "react";
import {
  getReferralCodeFromUrl,
  saveReferralCode,
  restoreReferralFromStorage,
} from "@/lib/referral-cookie";

/**
 * Captura el código de referido en el navegador:
 * - Si la URL trae ?ref=<código>, lo guarda en cookie JS + localStorage.
 *   La URL NO se limpia a propósito: el parámetro queda como respaldo de
 *   atribución aunque el visitante borre cookies y localStorage.
 * - Si la cookie se borró pero localStorage conserva el código, la restaura.
 * No pinta nada; solo mantiene viva la atribución en el cliente.
 */
export function ReferralCapture() {
  useEffect(() => {
    try {
      const ref = getReferralCodeFromUrl();
      if (ref) {
        saveReferralCode(ref);
        return;
      }
      restoreReferralFromStorage();
    } catch {
      // nunca romper la página por el tracking
    }
  }, []);

  return null;
}
