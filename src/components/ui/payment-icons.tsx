import type { ComponentType } from "react";

/**
 * Logos de los métodos de pago que acepta Caskiuz, en SVG inline.
 *
 * Trazos de simple-icons (Zelle, PayPal, Binance y Western Union) y de
 * cryptocurrency-icons (USDT, USDC y BTC), ambos con licencia CC0. No tienen
 * estado: sirven igual en componentes de servidor y de cliente.
 *
 * Los métodos fiat se dibujan sobre una placa con el color de marca (el
 * glifo en blanco o negro) para que se reconozcan en tema claro y oscuro;
 * las monedas cripto ya incluyen su propio círculo de color.
 */

interface IconProps {
  className?: string;
}

function brandTile(path: string, background: string, foreground: string) {
  return function BrandIcon({ className = "w-10 h-10 rounded-xl" }: IconProps) {
    return (
      <span
        aria-hidden
        className={`inline-flex shrink-0 items-center justify-center ${className}`}
        style={{ backgroundColor: background }}
      >
        <svg viewBox="0 0 24 24" fill={foreground} className="h-[60%] w-[60%]">
          <path d={path} />
        </svg>
      </span>
    );
  };
}

export const ZelleIcon = brandTile(
  "M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z",
  "#6D1ED4",
  "#FFFFFF"
);

export const PayPalIcon = brandTile(
  "M15.607 4.653H8.941L6.645 19.251H1.82L4.862 0h7.995c3.754 0 6.375 2.294 6.473 5.513-.648-.478-2.105-.86-3.722-.86m6.57 5.546c0 3.41-3.01 6.853-6.958 6.853h-2.493L11.595 24H6.74l1.845-11.538h3.592c4.208 0 7.346-3.634 7.153-6.949a5.24 5.24 0 0 1 2.848 4.686M9.653 5.546h6.408c.907 0 1.942.222 2.363.541-.195 2.741-2.655 5.483-6.441 5.483H8.714Z",
  "#0070E0",
  "#FFFFFF"
);

export const BinanceIcon = brandTile(
  "M16.624 13.9202l2.7175 2.7154-7.353 7.353-7.353-7.352 2.7175-2.7164 4.6355 4.6595 4.6356-4.6595zm4.6366-4.6366L24 12l-2.7154 2.7164L18.5682 12l2.6924-2.7164zm-9.272.001l2.7163 2.6914-2.7164 2.7174v-.001L9.2721 12l2.7164-2.7154zm-9.2722-.001L5.4088 12l-2.6914 2.6924L0 12l2.7164-2.7164zM11.9885.0115l7.353 7.329-2.7174 2.7154-4.6356-4.6356-4.6355 4.6595-2.7174-2.7154 7.353-7.353z",
  "#F0B90B",
  "#181A20"
);

export const WesternUnionIcon = brandTile(
  "M15.799 5.188h5.916L24 9.155l-4.643 8.043c-1.246 2.153-3.28 2.153-4.526 0L7.893 5.188h5.919l4.273 7.39a1.127 1.127 0 0 0 1.981.002l-4.267-7.392ZM0 5.188h5.921l6.237 10.802-.697 1.204c-1.246 2.153-3.285 2.153-4.531 0L0 5.188Z",
  "#FFDD00",
  "#1F1F1F"
);

export function UsdtCoinIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="#26A17B" />
        <path
          fill="#FFF"
          d="M17.922 17.383v-.002c-.11.008-.677.042-1.942.042-1.01 0-1.721-.03-1.971-.042v.003c-3.888-.171-6.79-.848-6.79-1.658 0-.809 2.902-1.486 6.79-1.66v2.644c.254.018.982.061 1.988.061 1.207 0 1.812-.05 1.925-.06v-2.643c3.88.173 6.775.85 6.775 1.658 0 .81-2.895 1.485-6.775 1.657m0-3.59v-2.366h5.414V7.819H8.595v3.608h5.414v2.365c-4.4.202-7.709 1.074-7.709 2.118 0 1.044 3.309 1.915 7.709 2.118v7.582h3.913v-7.584c4.393-.202 7.694-1.073 7.694-2.116 0-1.043-3.301-1.914-7.694-2.117"
        />
      </g>
    </svg>
  );
}

export function UsdcCoinIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <g fill="none">
        <circle fill="#2775CA" cx="16" cy="16" r="16" />
        <g fill="#FFF">
          <path d="M20.022 18.124c0-2.124-1.28-2.852-3.84-3.156-1.828-.243-2.193-.728-2.193-1.578 0-.85.61-1.396 1.828-1.396 1.097 0 1.707.364 2.011 1.275a.458.458 0 00.427.303h.975a.416.416 0 00.427-.425v-.06a3.04 3.04 0 00-2.743-2.489V9.142c0-.243-.183-.425-.487-.486h-.915c-.243 0-.426.182-.487.486v1.396c-1.829.242-2.986 1.456-2.986 2.974 0 2.002 1.218 2.791 3.778 3.095 1.707.303 2.255.668 2.255 1.639 0 .97-.853 1.638-2.011 1.638-1.585 0-2.133-.667-2.316-1.578-.06-.242-.244-.364-.427-.364h-1.036a.416.416 0 00-.426.425v.06c.243 1.518 1.219 2.61 3.23 2.914v1.457c0 .242.183.425.487.485h.915c.243 0 .426-.182.487-.485V21.34c1.829-.303 3.047-1.578 3.047-3.217z" />
          <path d="M12.892 24.497c-4.754-1.7-7.192-6.98-5.424-11.653.914-2.55 2.925-4.491 5.424-5.402.244-.121.365-.303.365-.607v-.85c0-.242-.121-.424-.365-.485-.061 0-.183 0-.244.06a10.895 10.895 0 00-7.13 13.717c1.096 3.4 3.717 6.01 7.13 7.102.244.121.488 0 .548-.243.061-.06.061-.122.061-.243v-.85c0-.182-.182-.424-.365-.546zm6.46-18.936c-.244-.122-.488 0-.548.242-.061.061-.061.122-.061.243v.85c0 .243.182.485.365.607 4.754 1.7 7.192 6.98 5.424 11.653-.914 2.55-2.925 4.491-5.424 5.402-.244.121-.365.303-.365.607v.85c0 .242.121.424.365.485.061 0 .183 0 .244-.06a10.895 10.895 0 007.13-13.717c-1.096-3.46-3.778-6.07-7.13-7.162z" />
        </g>
      </g>
    </svg>
  );
}

export function BtcCoinIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <g fill="none" fillRule="evenodd">
        <circle cx="16" cy="16" r="16" fill="#F7931A" />
        <path
          fill="#FFF"
          fillRule="nonzero"
          d="M23.189 14.02c.314-2.096-1.283-3.223-3.465-3.975l.708-2.84-1.728-.43-.69 2.765c-.454-.114-.92-.22-1.385-.326l.695-2.783L15.596 6l-.708 2.839c-.376-.086-.746-.17-1.104-.26l.002-.009-2.384-.595-.46 1.846s1.283.294 1.256.312c.7.175.826.638.805 1.006l-.806 3.235c.048.012.11.03.18.057l-.183-.045-1.13 4.532c-.086.212-.303.531-.793.41.018.025-1.256-.313-1.256-.313l-.858 1.978 2.25.561c.418.105.828.215 1.231.318l-.715 2.872 1.727.43.708-2.84c.472.127.93.245 1.378.357l-.706 2.828 1.728.43.715-2.866c2.948.558 5.164.333 6.097-2.333.752-2.146-.037-3.385-1.588-4.192 1.13-.26 1.98-1.003 2.207-2.538zm-3.95 5.538c-.533 2.147-4.148.986-5.32.695l.95-3.805c1.172.293 4.929.872 4.37 3.11zm.535-5.569c-.487 1.953-3.495.96-4.47.717l.86-3.45c.975.243 4.118.696 3.61 2.733z"
        />
      </g>
    </svg>
  );
}

/** Las tres monedas cripto que acepta Caskiuz, en fila (USDT · USDC · BTC). */
export function CryptoTrioIcon({ className = "w-7 h-7" }: IconProps) {
  return (
    <span aria-hidden className="inline-flex shrink-0 items-center gap-1">
      <UsdtCoinIcon className={className} />
      <UsdcCoinIcon className={className} />
      <BtcCoinIcon className={className} />
    </span>
  );
}

/** Logo por id de método (ver getClientPaymentMethods en src/lib/payments.ts). */
export const CLIENT_PAYMENT_ICONS: Record<string, ComponentType<IconProps>> = {
  zelle: ZelleIcon,
  paypal: PayPalIcon,
  binance: BinanceIcon,
  "western-union": WesternUnionIcon,
  crypto: CryptoTrioIcon,
};

/** Tamaño del icono dentro de las tarjetas del home. */
export const CLIENT_ICON_CLASS: Record<string, string> = {
  crypto: "w-7 h-7",
  default: "w-11 h-11 rounded-2xl",
};

/** Tamaño del icono en chips/badges pequeños (landing y panel). */
export const CLIENT_ICON_CLASS_SM: Record<string, string> = {
  crypto: "w-4 h-4",
  default: "w-5 h-5 rounded-md",
};
