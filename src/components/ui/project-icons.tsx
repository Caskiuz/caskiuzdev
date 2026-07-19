"use client";

export function ProjectIcon({ name, size = 200 }: { name: string; size?: number }) {
  const lower = name.toLowerCase();

  // Delivery / Mouzo / Nemy
  if (lower.includes("mouzo") || lower.includes("nemy") || lower.includes("delivery")) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="20" fill="url(#delivery-grad)" />
        <defs>
          <linearGradient id="delivery-grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF8E53" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <g transform="translate(30, 50)">
          <rect x="20" y="10" width="100" height="60" rx="8" fill="#FF6B6B" opacity="0.8" />
          <circle cx="35" cy="80" r="15" fill="#FF8E53" />
          <circle cx="105" cy="80" r="15" fill="#FF8E53" />
          <rect x="50" y="30" width="70" height="30" rx="4" fill="white" opacity="0.3" />
          <rect x="80" y="30" width="15" height="30" rx="2" fill="white" opacity="0.5" />
          <rect x="55" y="35" width="20" height="20" rx="3" fill="white" opacity="0.4" />
        </g>
      </svg>
    );
  }

  // ERP / Sistema / SistemaStart
  if (lower.includes("sistema") || lower.includes("erp") || lower.includes("start")) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="20" fill="url(#erp-grad)" />
        <defs>
          <linearGradient id="erp-grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <g transform="translate(40, 30)">
          <rect x="10" y="10" width="100" height="80" rx="8" fill="#6C5CE7" opacity="0.6" />
          <rect x="10" y="10" width="100" height="20" rx="8" fill="#00D2FF" opacity="0.8" />
          <rect x="20" y="40" width="35" height="8" rx="4" fill="white" opacity="0.3" />
          <rect x="20" y="55" width="50" height="8" rx="4" fill="white" opacity="0.2" />
          <rect x="20" y="70" width="40" height="8" rx="4" fill="white" opacity="0.15" />
          <circle cx="25" cy="25" r="3" fill="white" opacity="0.5" />
          <circle cx="35" cy="25" r="3" fill="white" opacity="0.5" />
          <circle cx="45" cy="25" r="3" fill="white" opacity="0.5" />
        </g>
      </svg>
    );
  }

  // Prestamos / Finance
  if (lower.includes("prestamo") || lower.includes("finance") || lower.includes("pago")) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="20" fill="url(#fin-grad)" />
        <defs>
          <linearGradient id="fin-grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#00D2FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <g transform="translate(50, 40)">
          <circle cx="50" cy="50" r="45" fill="#00D2FF" opacity="0.2" />
          <text x="50" y="60" textAnchor="middle" fill="#00D2FF" fontSize="40" fontWeight="bold" opacity="0.8">$</text>
          <rect x="30" y="75" width="40" height="25" rx="5" fill="#6C5CE7" opacity="0.6" />
          <rect x="25" y="80" width="15" height="15" rx="3" fill="#00D2FF" opacity="0.4" />
          <rect x="60" y="80" width="15" height="15" rx="3" fill="#00D2FF" opacity="0.4" />
        </g>
      </svg>
    );
  }

  // Click / Publik / Marketing
  if (lower.includes("click") || lower.includes("publik") || lower.includes("marketing")) {
    return (
      <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" rx="20" fill="url(#market-grad)" />
        <defs>
          <linearGradient id="market-grad" x1="0" y1="0" x2="200" y2="200">
            <stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#6C5CE7" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <g transform="translate(40, 35)">
          <rect x="10" y="40" width="80" height="55" rx="8" fill="#FF6B6B" opacity="0.5" />
          <rect x="15" y="50" width="30" height="20" rx="3" fill="white" opacity="0.3" />
          <rect x="50" y="50" width="30" height="20" rx="3" fill="white" opacity="0.3" />
          <rect x="15" y="75" width="65" height="8" rx="3" fill="white" opacity="0.2" />
          <line x1="50" y1="10" x2="50" y2="40" stroke="#FF6B6B" strokeWidth="4" opacity="0.6" />
          <circle cx="50" cy="10" r="8" fill="#6C5CE7" opacity="0.7" />
          <line x1="50" y1="95" x2="50" y2="120" stroke="#FF6B6B" strokeWidth="4" opacity="0.4" />
        </g>
      </svg>
    );
  }

  // Default: code icon
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" rx="20" fill="url(#code-grad)" />
      <defs>
        <linearGradient id="code-grad" x1="0" y1="0" x2="200" y2="200">
          <stop offset="0%" stopColor="#6C5CE7" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#00D2FF" stopOpacity="0.15" />
        </linearGradient>
      </defs>
      <g transform="translate(30, 40)">
        <rect x="10" y="10" width="120" height="90" rx="10" fill="#13131a" opacity="0.8" />
        <text x="25" y="35" fill="#6C5CE7" fontSize="14" fontFamily="monospace" opacity="0.8">{`<code>`}</text>
        <text x="25" y="55" fill="#00D2FF" fontSize="13" fontFamily="monospace" opacity="0.6">{`  const `}</text>
        <text x="65" y="55" fill="#FF6B6B" fontSize="13" fontFamily="monospace" opacity="0.7">{`app`}</text>
        <text x="25" y="75" fill="#8888A0" fontSize="13" fontFamily="monospace" opacity="0.5">{`  // deploy`}</text>
        <text x="25" y="95" fill="#6C5CE7" fontSize="14" fontFamily="monospace" opacity="0.8">{`</code>`}</text>
      </g>
    </svg>
  );
}