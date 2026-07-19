"use client";

import { useId } from "react";

const ICON_SIZE = 160;

export function ProjectIcon({ name, size = ICON_SIZE }: { name: string; size?: number }) {
  const uid = useId();
  const lower = name.toLowerCase();

  // Delivery: Scooter de reparto con paquete
  if (lower.includes("mouzo") || lower.includes("nemy") || lower.includes("delivery")) {
    const g = `${uid}-d`;
    return (
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-body`} x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#6C5CE7" stopOpacity="1" />
          </linearGradient>
        </defs>
        <g transform="translate(25, 32)">
          {/* Ruedas */}
          <circle cx="100" cy="88" r="14" fill="none" stroke={`url(#${g}-body)`} strokeWidth="7" opacity="0.9" />
          <circle cx="100" cy="88" r="5" fill={`url(#${g}-body)`} opacity="0.7" />
          <circle cx="35" cy="88" r="14" fill="none" stroke={`url(#${g}-body)`} strokeWidth="7" opacity="0.9" />
          <circle cx="35" cy="88" r="5" fill={`url(#${g}-body)`} opacity="0.7" />
          {/* Chasis - líneas más gruesas */}
          <path d="M35 88L50 48L85 48L100 88" fill="none" stroke={`url(#${g}-body)`} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          {/* Manubrio */}
          <line x1="42" y1="48" x2="32" y2="28" stroke={`url(#${g}-body)`} strokeWidth="5" strokeLinecap="round" />
          <line x1="22" y1="28" x2="42" y2="28" stroke={`url(#${g}-body)`} strokeWidth="5" strokeLinecap="round" />
          {/* Caja de delivery */}
          <rect x="62" y="12" width="45" height="36" rx="6" fill={`url(#${g}-body)`} opacity="0.9" />
          <line x1="69" y1="20" x2="100" y2="20" stroke="white" strokeWidth="2" opacity="0.35" />
          <line x1="69" y1="29" x2="94" y2="29" stroke="white" strokeWidth="2" opacity="0.35" />
          <line x1="69" y1="38" x2="100" y2="38" stroke="white" strokeWidth="2" opacity="0.35" />
          {/* Faro */}
          <circle cx="22" cy="28" r="4.5" fill="#00E5FF" opacity="1">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Préstamos / Finance: Tarjeta cyan + monedas doradas
  if (lower.includes("prestamo") || lower.includes("finance") || lower.includes("pago")) {
    const g = `${uid}-f`;
    return (
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-card`} x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <linearGradient id={`${g}-coin`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
        {/* Grupo con escala 85% para padding visual */}
        <g transform="translate(12, 12) scale(0.85)">
          {/* Tarjeta de crédito */}
          <rect x="10" y="20" width="110" height="70" rx="9" fill={`url(#${g}-card)`} fillOpacity="0.2" stroke={`url(#${g}-card)`} strokeWidth="1.5" strokeOpacity="0.5" />
          {/* Chip */}
          <rect x="20" y="32" width="20" height="14" rx="3" fill={`url(#${g}-card)`} opacity="0.7" />
          {/* Símbolo $ centrado */}
          <text x="65" y="68" textAnchor="middle" dominantBaseline="middle" fill={`url(#${g}-card)`} fontSize="30" fontWeight="800" fontFamily="system-ui" opacity="1">$</text>
          {/* Líneas decorativas */}
          <line x1="22" y1="105" x2="98" y2="105" stroke="white" strokeWidth="1" opacity="0.15" />
          <line x1="22" y1="113" x2="85" y2="113" stroke="white" strokeWidth="1" opacity="0.12" />
          {/* Monedas - a la derecha, sin tocar bordes */}
          <circle cx="130" cy="40" r="11" fill={`url(#${g}-coin)`} opacity="0.9" />
          <text x="130" y="45" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="10" fontWeight="800">$</text>
          <circle cx="130" cy="90" r="9" fill={`url(#${g}-coin)`} opacity="0.75" />
          <text x="130" y="94" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="8" fontWeight="800">$</text>
        </g>
      </svg>
    );
  }

  // ERP / Sistema: Dashboard con barras alineadas
  if (lower.includes("sistema") || lower.includes("erp") || lower.includes("start")) {
    const g = `${uid}-e`;
    return (
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-e1`} x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id={`${g}-e2`} x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
        <g transform="translate(14, 14)">
          <rect x="0" y="0" width="132" height="132" rx="10" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          {/* Header */}
          <rect x="0" y="0" width="132" height="26" rx="10" fill={`url(#${g}-e1)`} fillOpacity="0.15" />
          <rect x="0" y="13" width="132" height="13" fill={`url(#${g}-e1)`} fillOpacity="0.15" />
          <circle cx="13" cy="13" r="3.5" fill="#FF007F" />
          <circle cx="24" cy="13" r="3.5" fill="#FF8E53" />
          <circle cx="35" cy="13" r="3.5" fill="#00C853" />
          {/* Barras - todas alineadas al mismo baseline y=115 */}
          <rect x="12" y="50" width="19" height="65" rx="3" fill={`url(#${g}-e1)`} opacity="0.55" />
          <rect x="38" y="67" width="19" height="48" rx="3" fill={`url(#${g}-e1)`} opacity="0.65" />
          <rect x="64" y="38" width="19" height="77" rx="3" fill={`url(#${g}-e2)`} opacity="0.7">
            <animate attributeName="height" values="77;60;77" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y" values="38;55;38" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="90" y="82" width="19" height="33" rx="3" fill={`url(#${g}-e1)`} opacity="0.45" />
          {/* Línea base */}
          <line x1="12" y1="115" x2="109" y2="115" stroke="white" strokeWidth="1" opacity="0.08" />
        </g>
      </svg>
    );
  }

  // Marketing / Publik: Megáfono + gráfico
  if (lower.includes("click") || lower.includes("publik") || lower.includes("marketing")) {
    const g = `${uid}-m`;
    return (
      <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-m1`} x1="0" y1="0" x2="160" y2="160">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
        <g transform="translate(18, 18)">
          {/* Megáfono */}
          <path d="M85 12L118 0v38L85 25M32 30v12a7 7 0 007 7h7l39 7V23L48 14H39a7 7 0 00-7 7v9z" fill={`url(#${g}-m1)`} fillOpacity="0.85" />
          {/* Ondas */}
          <path d="M14 24Q23 35 14 47" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" />
          </path>
          <path d="M5 20Q16 35 5 52" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="2" strokeLinecap="round" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite" />
          </path>
          {/* Gráfico */}
          <rect x="10" y="68" width="105" height="55" rx="7" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          <polyline points="24,112 46,90 68,96 90,64 108,42 122,50" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="24" cy="112" r="2.5" fill={`url(#${g}-m1)`} />
          <circle cx="46" cy="90" r="2.5" fill={`url(#${g}-m1)`} />
          <circle cx="68" cy="96" r="2.5" fill={`url(#${g}-m1)`} />
          <circle cx="90" cy="64" r="2.5" fill={`url(#${g}-m1)`} />
          <circle cx="108" cy="42" r="4" fill="#00E5FF" opacity="1">
            <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Default: Editor de código
  const g = `${uid}-c`;
  return (
    <svg width={size} height={size} viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-c1`} x1="0" y1="0" x2="160" y2="160">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <g transform="translate(16, 16)">
        <rect x="0" y="0" width="128" height="128" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
        <rect x="0" y="0" width="128" height="24" rx="8" fill={`url(#${g}-c1)`} fillOpacity="0.12" />
        <rect x="0" y="16" width="128" height="8" fill={`url(#${g}-c1)`} fillOpacity="0.12" />
        <circle cx="13" cy="12" r="3.5" fill="#FF007F" />
        <circle cx="24" cy="12" r="3.5" fill="#FF8E53" />
        <circle cx="35" cy="12" r="3.5" fill="#00C853" />
        <rect x="12" y="40" width="50" height="7" rx="3" fill="#FF007F" opacity="0.5" />
        <rect x="66" y="40" width="22" height="7" rx="3" fill="white" opacity="0.3" />
        <rect x="12" y="58" width="35" height="7" rx="3" fill="#6C5CE7" opacity="0.5" />
        <rect x="12" y="76" width="58" height="7" rx="3" fill="#00E5FF" opacity="0.45" />
        <rect x="12" y="94" width="70" height="7" rx="3" fill="white" opacity="0.2" />
        <rect x="12" y="112" width="30" height="7" rx="3" fill="white" opacity="0.15" />
        <rect x="50" y="58" width="2.5" height="9" rx="1" fill="#00E5FF" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0;0.9" dur="1s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}