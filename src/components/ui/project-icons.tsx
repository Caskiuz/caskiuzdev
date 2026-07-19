"use client";

export function ProjectIcon({ name, size = 200 }: { name: string; size?: number }) {
  const lower = name.toLowerCase();

  // Delivery / Mouzo / Nemy
  if (lower.includes("mouzo") || lower.includes("nemy") || lower.includes("delivery")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="delGrad" x1="0" y1="0" x2="240" y2="240">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <filter id="delShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#00E5FF" floodOpacity="0.3" />
          </filter>
        </defs>
        {/* Fondo sutil */}
        <rect x="20" y="20" width="200" height="200" rx="24" fill="white" fillOpacity="0.03" />
        {/* Camión de delivery */}
        <g transform="translate(30, 60)" filter="url(#delShadow)">
          {/* Caja de carga */}
          <path
            d="M65 10h100c5 0 10 5 10 10v45c0 5-5 10-10 10H65c-5 0-10-5-10-10V20c0-5 5-10 10-10z"
            fill="url(#delGrad)"
            opacity="0.9"
          />
          {/* Líneas de la caja */}
          <line x1="75" y1="25" x2="155" y2="25" stroke="white" strokeWidth="1.5" opacity="0.3" />
          <line x1="75" y1="35" x2="140" y2="35" stroke="white" strokeWidth="1.5" opacity="0.25" />
          <line x1="75" y1="45" x2="120" y2="45" stroke="white" strokeWidth="1.5" opacity="0.2" />
          {/* Cabina */}
          <path
            d="M10 25c0-8 7-15 15-15h35l10 25H10V25z"
            fill="#6C5CE7"
            opacity="0.9"
          />
          {/* Ventana */}
          <path d="M25 27h15v10H25z" rx="3" fill="white" opacity="0.35" />
          {/* Rueda delantera */}
          <circle cx="35" cy="75" r="16" fill="white" opacity="0.15" />
          <circle cx="35" cy="75" r="10" fill="url(#delGrad)" />
          <circle cx="35" cy="75" r="4" fill="white" opacity="0.4" />
          {/* Rueda trasera */}
          <circle cx="155" cy="75" r="16" fill="white" opacity="0.15" />
          <circle cx="155" cy="75" r="10" fill="url(#delGrad)" />
          <circle cx="155" cy="75" r="4" fill="white" opacity="0.4" />
        </g>
        {/* Partículas */}
        <circle cx="50" cy="40" r="2" fill="#00E5FF" opacity="0.6">
          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="200" cy="30" r="1.5" fill="#6C5CE7" opacity="0.5">
          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>
    );
  }

  // ERP / Sistema / SistemaStart
  if (lower.includes("sistema") || lower.includes("erp") || lower.includes("start")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="erpGrad" x1="0" y1="0" x2="240" y2="200">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <linearGradient id="erpBar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#6C5CE7" />
          </linearGradient>
          <filter id="erpShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#FF007F" floodOpacity="0.25" />
          </filter>
        </defs>
        <rect x="20" y="20" width="200" height="200" rx="24" fill="white" fillOpacity="0.03" />
        <g transform="translate(35, 25)" filter="url(#erpShadow)">
          {/* Panel principal */}
          <path
            d="M0 20c0-11 9-20 20-20h130c11 0 20 9 20 20v130c0 11-9 20-20 20H20c-11 0-20-9-20-20V20z"
            fill="url(#erpGrad)"
            fillOpacity="0.15"
          />
          {/* Header bar */}
          <rect x="0" y="0" width="170" height="35" rx="8" fill="url(#erpGrad)" fillOpacity="0.8" />
          <circle cx="18" cy="17.5" r="5" fill="#00E5FF" opacity="0.9" />
          <circle cx="33" cy="17.5" r="5" fill="#6C5CE7" opacity="0.9" />
          <circle cx="48" cy="17.5" r="5" fill="#FF007F" opacity="0.9" />
          {/* Barra de progreso */}
          <rect x="15" y="55" width="140" height="8" rx="4" fill="white" fillOpacity="0.08" />
          <rect x="15" y="55" width="100" height="8" rx="4" fill="url(#erpBar)" />
          {/* Gráfico de barras */}
          <rect x="15" y="80" width="18" height="40" rx="3" fill="#00E5FF" opacity="0.7">
            <animate attributeName="height" values="40;60;40" dur="3s" repeatCount="indefinite" />
          </rect>
          <rect x="42" y="100" width="18" height="20" rx="3" fill="#6C5CE7" opacity="0.7">
            <animate attributeName="height" values="20;50;20" dur="3.5s" repeatCount="indefinite" />
          </rect>
          <rect x="69" y="70" width="18" height="50" rx="3" fill="#FF007F" opacity="0.7">
            <animate attributeName="height" values="50;35;50" dur="2.8s" repeatCount="indefinite" />
          </rect>
          <rect x="96" y="85" width="18" height="35" rx="3" fill="#00E5FF" opacity="0.6">
            <animate attributeName="height" values="35;55;35" dur="3.2s" repeatCount="indefinite" />
          </rect>
          {/* Líneas de tabla */}
          <line x1="15" y1="145" x2="155" y2="145" stroke="white" strokeOpacity="0.06" strokeWidth="1" />
          <line x1="15" y1="155" x2="140" y2="155" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
          <line x1="15" y1="165" x2="145" y2="165" stroke="white" strokeOpacity="0.04" strokeWidth="1" />
        </g>
      </svg>
    );
  }

  // Prestamos / Finance
  if (lower.includes("prestamo") || lower.includes("finance") || lower.includes("pago")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="finGrad" x1="0" y1="0" x2="240" y2="240">
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="100%" stopColor="#00C853" />
          </linearGradient>
          <filter id="finShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#00E5FF" floodOpacity="0.2" />
          </filter>
        </defs>
        <rect x="20" y="20" width="200" height="200" rx="24" fill="white" fillOpacity="0.03" />
        <g transform="translate(45, 25)" filter="url(#finShadow)">
          {/* Tarjeta principal */}
          <path
            d="M15 40c0-8 7-15 15-15h100c8 0 15 7 15 15v80c0 8-7 15-15 15H30c-8 0-15-7-15-15V40z"
            fill="url(#finGrad)"
            fillOpacity="0.12"
            rx="12"
          />
          {/* Chip */}
          <rect x="25" y="50" width="20" height="14" rx="3" fill="url(#finGrad)" opacity="0.5" />
          {/* Símbolo $ */}
          <text
            x="75"
            y="85"
            textAnchor="middle"
            fill="url(#finGrad)"
            fontSize="42"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
            opacity="0.9"
          >
            $
          </text>
          {/* Líneas en la tarjeta */}
          <line x1="30" y1="105" x2="120" y2="105" stroke="white" strokeWidth="1.5" opacity="0.12" />
          <line x1="30" y1="115" x2="100" y2="115" stroke="white" strokeWidth="1.5" opacity="0.08" />
          {/* Monedas flotantes */}
          <circle cx="150" cy="40" r="14" fill="url(#finGrad)" opacity="0.6">
            <animate attributeName="cy" values="40;30;40" dur="2s" repeatCount="indefinite" />
          </circle>
          <text x="150" y="46" textAnchor="middle" fill="white" fontSize="12" fontWeight="700" opacity="0.8">
            $
          </text>
          <circle cx="155" cy="100" r="10" fill="#6C5CE7" opacity="0.5">
            <animate attributeName="cy" values="100;90;100" dur="2.5s" repeatCount="indefinite" />
          </circle>
          <text x="155" y="105" textAnchor="middle" fill="white" fontSize="9" fontWeight="700" opacity="0.7">
            $
          </text>
        </g>
      </svg>
    );
  }

  // Click / Publik / Marketing
  if (lower.includes("click") || lower.includes("publik") || lower.includes("marketing")) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="mktGrad" x1="0" y1="240" x2="240" y2="0">
            <stop offset="0%" stopColor="#FF007F" />
            <stop offset="100%" stopColor="#FF8E53" />
          </linearGradient>
          <filter id="mktShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#FF007F" floodOpacity="0.25" />
          </filter>
        </defs>
        <rect x="20" y="20" width="200" height="200" rx="24" fill="white" fillOpacity="0.03" />
        <g transform="translate(40, 30)" filter="url(#mktShadow)">
          {/* Megáfono */}
          <path
            d="M90 20L150 5v50l-60-15M30 40v20c0 5 5 10 10 10h10l40 10V30L50 20H40c-5 0-10 5-10 10z"
            fill="url(#mktGrad)"
            opacity="0.8"
          />
          {/* Ondas de sonido */}
          <path
            d="M15 35 Q25 50 15 65"
            stroke="url(#mktGrad)"
            strokeWidth="3"
            fill="none"
            opacity="0.6"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0.6;0.2;0.6" dur="1.5s" repeatCount="indefinite" />
          </path>
          <path
            d="M5 30 Q20 50 5 70"
            stroke="url(#mktGrad)"
            strokeWidth="2"
            fill="none"
            opacity="0.4"
            strokeLinecap="round"
          >
            <animate attributeName="opacity" values="0.4;0.1;0.4" dur="2s" repeatCount="indefinite" />
          </path>
          {/* Gráfico de crecimiento */}
          <rect x="20" y="90" width="130" height="70" rx="8" fill="url(#mktGrad)" fillOpacity="0.08" />
          <path
            d="M30 150L60 120L85 130L110 90L130 60L145 75"
            stroke="url(#mktGrad)"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Puntos en el gráfico */}
          <circle cx="30" cy="150" r="4" fill="url(#mktGrad)" />
          <circle cx="60" cy="120" r="4" fill="url(#mktGrad)" />
          <circle cx="85" cy="130" r="4" fill="url(#mktGrad)" />
          <circle cx="110" cy="90" r="4" fill="url(#mktGrad)" />
          <circle cx="130" cy="60" r="5" fill="#00E5FF">
            <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </svg>
    );
  }

  // Default: code / dev
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="codeGrad" x1="0" y1="0" x2="240" y2="240">
          <stop offset="0%" stopColor="#6C5CE7" />
          <stop offset="100%" stopColor="#00E5FF" />
        </linearGradient>
        <filter id="codeShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="#6C5CE7" floodOpacity="0.2" />
        </filter>
      </defs>
      <rect x="20" y="20" width="200" height="200" rx="24" fill="white" fillOpacity="0.03" />
      <g transform="translate(30, 30)" filter="url(#codeShadow)">
        {/* Ventana del editor */}
        <path
          d="M0 0h180v140H0z"
          fill="white"
          fillOpacity="0.04"
          rx="12"
        />
        {/* Barra de título */}
        <path d="M0 0h180v30H0z" fill="url(#codeGrad)" fillOpacity="0.15" rx="12" />
        <path d="M0 15h180v15H0z" fill="url(#codeGrad)" fillOpacity="0.15" />
        <circle cx="18" cy="15" r="5" fill="#FF007F" opacity="0.8" />
        <circle cx="33" cy="15" r="5" fill="#FF8E53" opacity="0.8" />
        <circle cx="48" cy="15" r="5" fill="#00C853" opacity="0.8" />
        {/* Código */}
        <text x="20" y="55" fill="#FF007F" fontSize="14" fontFamily="monospace" opacity="0.8">
          {"import"}
        </text>
        <text x="70" y="55" fill="white" fontSize="14" fontFamily="monospace" opacity="0.9">
          {" { "}
        </text>
        <text x="20" y="75" fill="#6C5CE7" fontSize="14" fontFamily="monospace" opacity="0.8">
          {"  Caskiuz"}
        </text>
        <text x="145" y="55" fill="white" fontSize="14" fontFamily="monospace" opacity="0.9">
          {" }"}
        </text>
        <text x="20" y="95" fill="#00E5FF" fontSize="14" fontFamily="monospace" opacity="0.8">
          {"  from"}
        </text>
        <text x="20" y="115" fill="#8888A0" fontSize="14" fontFamily="monospace" opacity="0.5">
          {"    'caskiuz.dev'"}
        </text>
        {/* Cursor parpadeante */}
        <rect x="55" y="82" width="2" height="16" fill="#00E5FF" opacity="0.8">
          <animate attributeName="opacity" values="0.8;0;0.8" dur="1s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}