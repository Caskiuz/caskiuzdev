"use client";

import { useId } from "react";

export function ProjectIcon({ name, size = 200 }: { name: string; size?: number }) {
  const uid = useId();
  const lower = name.toLowerCase();

  // Delivery: Scooter de reparto con paquete
  if (lower.includes("mouzo") || lower.includes("nemy") || lower.includes("delivery")) {
    const g = `${uid}-d`;
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-body`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
        </defs>
        {/* Scooter */}
        <g transform="translate(40, 45)">
          {/* Rueda trasera */}
          <circle cx="110" cy="100" r="18" fill="none" stroke={`url(#${g}-body)`} strokeWidth="6" opacity="0.8" />
          <circle cx="110" cy="100" r="6" fill={`url(#${g}-body)`} opacity="0.6" />
          {/* Rueda delantera */}
          <circle cx="40" cy="100" r="18" fill="none" stroke={`url(#${g}-body)`} strokeWidth="6" opacity="0.8" />
          <circle cx="40" cy="100" r="6" fill={`url(#${g}-body)`} opacity="0.6" />
          {/* Chasis */}
          <path d="M40 100L55 55L95 55L110 100" fill="none" stroke={`url(#${g}-body)`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Manubrio */}
          <line x1="45" y1="55" x2="35" y2="35" stroke={`url(#${g}-body)`} strokeWidth="4" strokeLinecap="round" />
          <line x1="28" y1="35" x2="42" y2="35" stroke={`url(#${g}-body)`} strokeWidth="4" strokeLinecap="round" />
          {/* Caja de delivery */}
          <rect x="70" y="20" width="50" height="35" rx="6" fill={`url(#${g}-body)`} opacity="0.85" />
          <line x1="78" y1="28" x2="112" y2="28" stroke="white" strokeWidth="1.5" opacity="0.3" />
          <line x1="78" y1="38" x2="105" y2="38" stroke="white" strokeWidth="1.5" opacity="0.3" />
          <line x1="78" y1="48" x2="112" y2="48" stroke="white" strokeWidth="1.5" opacity="0.3" />
          {/* Faro */}
          <circle cx="28" cy="35" r="4" fill="#00E5FF" opacity="0.9">
            <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Préstamos: Monedas apiladas y símbolo $
  if (lower.includes("prestamo") || lower.includes("finance") || lower.includes("pago")) {
    const g = `${uid}-f`;
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-gold`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FF8E53" />
            <stop offset="100%" stopColor="#FF007F" />
          </linearGradient>
        </defs>
        <g transform="translate(40, 30)">
          {/* Tarjeta de crédito */}
          <rect x="0" y="20" width="120" height="75" rx="10" fill={`url(#${g}-gold)`} opacity="0.15" stroke={`url(#${g}-gold)`} strokeWidth="1.5" strokeOpacity="0.3" />
          {/* Chip */}
          <rect x="12" y="32" width="22" height="14" rx="3" fill={`url(#${g}-gold)`} opacity="0.6" />
          {/* Símbolo $ central */}
          <text x="60" y="72" textAnchor="middle" fill={`url(#${g}-gold)`} fontSize="32" fontWeight="700" fontFamily="system-ui" opacity="0.95">$</text>
          {/* Líneas de la tarjeta */}
          <line x1="15" y1="118" x2="105" y2="118" stroke={`url(#${g}-gold)`} strokeWidth="1" opacity="0.2" />
          <line x1="15" y1="126" x2="90" y2="126" stroke={`url(#${g}-gold)`} strokeWidth="1" opacity="0.15" />
          {/* Monedas flotantes */}
          <circle cx="130" cy="40" r="16" fill={`url(#${g}-gold)`} opacity="0.7">
            <animate attributeName="cy" values="40;32;40" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x="130" y="46" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">$</text>
          <circle cx="135" cy="105" r="12" fill={`url(#${g}-gold)`} opacity="0.5">
            <animate attributeName="cy" values="105;97;105" dur="3s" repeatCount="indefinite" />
          </circle>
          <text x="135" y="110" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">$</text>
        </g>
      </svg>
    );
  }

  // ERP / Sistema: Dashboard con barras alineadas
  if (lower.includes("sistema") || lower.includes("erp") || lower.includes("start")) {
    const g = `${uid}-e`;
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-e1`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#6C5CE7" />
            <stop offset="100%" stopColor="#00E5FF" />
          </linearGradient>
          <linearGradient id={`${g}-e2`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
        <g transform="translate(20, 20)">
          {/* Panel container */}
          <rect x="0" y="0" width="160" height="160" rx="12" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          {/* Header */}
          <rect x="0" y="0" width="160" height="32" rx="12" fill={`url(#${g}-e1)`} fillOpacity="0.15" />
          <rect x="0" y="16" width="160" height="16" fill={`url(#${g}-e1)`} fillOpacity="0.15" />
          <circle cx="16" cy="16" r="4" fill="#FF007F" />
          <circle cx="28" cy="16" r="4" fill="#FF8E53" />
          <circle cx="40" cy="16" r="4" fill="#00C853" />
          {/* Barras del gráfico - alineadas a una línea base (y=140) */}
          <rect x="15" y="60" width="22" height="80" rx="4" fill={`url(#${g}-e1)`} opacity="0.55" />
          <rect x="48" y="80" width="22" height="60" rx="4" fill={`url(#${g}-e1)`} opacity="0.65" />
          <rect x="81" y="45" width="22" height="95" rx="4" fill={`url(#${g}-e2)`} opacity="0.7">
            <animate attributeName="height" values="95;75;95" dur="3s" repeatCount="indefinite" />
            <animate attributeName="y" values="45;65;45" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="114" y="100" width="22" height="40" rx="4" fill={`url(#${g}-e1)`} opacity="0.45" />
          {/* Línea base */}
          <line x1="15" y1="140" x2="136" y2="140" stroke="white" strokeWidth="1" opacity="0.08" />
          {/* Líneas de fondo del grid */}
          <line x1="15" y1="60" x2="15" y2="140" stroke="white" strokeWidth="0.5" opacity="0.04" />
          <line x1="48" y1="80" x2="48" y2="140" stroke="white" strokeWidth="0.5" opacity="0.04" />
          <line x1="81" y1="45" x2="81" y2="140" stroke="white" strokeWidth="0.5" opacity="0.04" />
          <line x1="114" y1="100" x2="114" y2="140" stroke="white" strokeWidth="0.5" opacity="0.04" />
        </g>
      </svg>
    );
  }

  // Marketing / Publik: Megáfono + gráfico
  if (lower.includes("click") || lower.includes("publik") || lower.includes("marketing")) {
    const g = `${uid}-m`;
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`${g}-m1`} x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
        </defs>
        <g transform="translate(25, 25)">
          {/* Megáfono */}
          <path d="M100 15L140 0v45L100 30M40 35v15a8 8 0 008 8h8l44 8V27L56 17H48a8 8 0 00-8 8v10z" fill={`url(#${g}-m1)`} fillOpacity="0.85" />
          {/* Ondas sonido */}
          <path d="M20 30Q30 42 20 55" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <animate attributeName="opacity" values="0.6;0.15;0.6" dur="1.8s" repeatCount="indefinite" />
          </path>
          <path d="M10 25Q22 42 10 60" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="2" strokeLinecap="round" opacity="0.4">
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2.2s" repeatCount="indefinite" />
          </path>
          {/* Gráfico de crecimiento */}
          <rect x="15" y="80" width="120" height="65" rx="8" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          <polyline points="30,130 55,105 80,112 105,75 125,50 140,60" fill="none" stroke={`url(#${g}-m1)`} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="30" cy="130" r="3" fill={`url(#${g}-m1)`} />
          <circle cx="55" cy="105" r="3" fill={`url(#${g}-m1)`} />
          <circle cx="80" cy="112" r="3" fill={`url(#${g}-m1)`} />
          <circle cx="105" cy="75" r="3" fill={`url(#${g}-m1)`} />
          <circle cx="125" cy="50" r="4.5" fill="#00E5FF" opacity="0.9">
            <animate attributeName="r" values="4.5;6.5;4.5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Default: Editor de código
  const g = `${uid}-c`;
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${g}-c1`} x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
      </defs>
      <g transform="translate(20, 20)">
        <rect x="0" y="0" width="160" height="160" rx="10" fill="white" fillOpacity="0.03" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
        {/* Title bar */}
        <rect x="0" y="0" width="160" height="28" rx="10" fill={`url(#${g}-c1)`} fillOpacity="0.12" />
        <rect x="0" y="18" width="160" height="10" fill={`url(#${g}-c1)`} fillOpacity="0.12" />
        <circle cx="16" cy="14" r="4.5" fill="#FF007F" />
        <circle cx="30" cy="14" r="4.5" fill="#FF8E53" />
        <circle cx="44" cy="14" r="4.5" fill="#00C853" />
        {/* Code lines */}
        <rect x="15" y="48" width="55" height="8" rx="4" fill="#FF007F" opacity="0.5" />
        <rect x="75" y="48" width="25" height="8" rx="4" fill="white" opacity="0.3" />
        <rect x="15" y="68" width="40" height="8" rx="4" fill="#6C5CE7" opacity="0.5" />
        <rect x="15" y="88" width="65" height="8" rx="4" fill="#00E5FF" opacity="0.45" />
        <rect x="15" y="108" width="80" height="8" rx="4" fill="white" opacity="0.2" />
        <rect x="15" y="128" width="35" height="8" rx="4" fill="white" opacity="0.15" />
        {/* Cursor */}
        <rect x="58" y="68" width="2" height="10" rx="1" fill="#00E5FF" opacity="0.9">
          <animate attributeName="opacity" values="0.9;0;0.9" dur="1s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}