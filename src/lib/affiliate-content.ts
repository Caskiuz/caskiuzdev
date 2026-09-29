/**
 * Contenido compartido de la sección de afiliados (FAQ y términos).
 * Mantenido en código para servir las páginas /afiliados/faq y la landing.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const AFFILIATE_FAQS: FaqItem[] = [
  {
    q: "¿Cuánto cuesta unirse al programa de afiliados?",
    a: "Nada. Unirse a Caskiuz Affiliates es 100% gratis. Solo necesitas registrarte, aceptar los términos y empezar a compartir tu link único. No hay cuotas de entrada ni mínimos de venta.",
  },
  {
    q: "¿Cómo se calcula mi comisión?",
    a: "Ganas un porcentaje del monto efectivamente cobrado al cliente (no sobre anticipos futuros). Empiezas en 10% y subes de nivel automáticamente según tu volumen de ventas referidas cobradas: 20% desde $2,000, 30% desde $5,000 y 40% desde $15,000 USD.",
  },
  {
    q: "¿Cuándo puedo retirar mis comisiones?",
    a: "Al instante: en cuanto el cliente paga (el 50% de anticipo o el total), tu comisión sobre ese dinero queda disponible de inmediato y puedes solicitar retiro desde $30 USD.",
  },
  {
    q: "¿En qué monedas me pagan?",
    a: "Puedes cobrar en USDT o USDC en las redes Tron (TRC-20), Ethereum (ERC-20), BNB Smart Chain (BEP-20), Solana, Polygon y Arbitrum; también en Bitcoin (BTC) o directamente vía Binance Pay usando tu Binance ID o email. Además, según tu país puedes usar métodos locales: en Venezuela, bolívares por Pago Móvil; en Colombia, pesos por Nequi, Bancolombia o Daviplata; y en Estados Unidos, Zelle en dólares. Registras tus datos en la sección Comisiones y retiros.",
  },
  {
    q: "¿Cómo sé que una venta es mía?",
    a: "Tu link coloca una cookie de 30 días en el navegador del visitante. Si esa persona se contacta y contrata, la venta se atribuye a ti. También puedes darle a tu cliente tu código de referido para que lo ingrese al contactar.",
  },
  {
    q: "¿Cómo pagan los clientes que refiero?",
    a: "Los clientes pueden pagar con Zelle, PayPal, Western Union, Binance o envíos cripto (USDT, USDC o BTC) a las wallets de Caskiuz, con el esquema 50% de anticipo y 50% al finalizar. Los datos de pago aparecen en la landing de afiliados y en tu panel. Tu comisión se te paga aparte, en USDT, USDC, BTC o Binance Pay para todos y, según tu país, también por métodos locales: Pago Móvil en Venezuela, Nequi/Bancolombia/Daviplata en Colombia y Zelle en Estados Unidos.",
  },
  {
    q: "¿Puedo comprar para mí mismo y cobrar la comisión?",
    a: "No. La auto-compra y las compras de familiares directos están prohibidas por los términos del programa y son motivo de suspensión de la cuenta.",
  },
  {
    q: "¿Necesito factura o documentos para cobrar?",
    a: "Para tu primer retiro debes verificar tu identidad subiendo un documento (cédula, pasaporte o DNI) desde tu panel. Es un requisito de seguridad y compliance, igual que en las grandes redes.",
  },
  {
    q: "¿Cómo promociono los servicios?",
    a: "Comparte tu link en redes sociales, blogs, YouTube, WhatsApp, newsletters o comunidades. En tu panel encontrarás banners, textos listos para copiar y guías con estrategias de promoción.",
  },
];

export interface TermSection {
  title: string;
  paragraphs: string[];
}

export const AFFILIATE_TERMS: TermSection[] = [
  {
    title: "1. Aceptación de los términos",
    paragraphs: [
      "Al registrarte en el programa de afiliados de Caskiuz aceptas estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no utilices el programa. Nos reservamos el derecho de rechazar, suspender o cancelar cualquier cuenta a nuestra discreción, en especial ante indicios de fraude o incumplimiento.",
    ],
  },
  {
    title: "2. Elegibilidad",
    paragraphs: [
      "Puede participar cualquier persona mayor de 18 años con capacidad legal, que complete el registro con datos reales y verificables. La aprobación de la cuenta puede requerir verificación de identidad. Prohibimos explícitamente la auto-compra y las compras realizadas por familiares directos, empleados o empresas vinculadas al afiliado con el único fin de cobrar comisiones.",
    ],
  },
  {
    title: "3. Comisiones y niveles",
    paragraphs: [
      "La comisión es un porcentaje del monto efectivamente cobrado al cliente (impuestos y reembolsos excluidos). No se generan comisiones sobre anticipos prometidos ni sobre montos no cobrados. Los niveles se asignan automáticamente según el volumen acumulado de ventas referidas cobradas: Plata 10% (desde $0), Oro 20% (desde $2,000 USD), Platino 30% (desde $5,000 USD) y Diamante 40% (desde $15,000 USD). Caskiuz puede ajustar las tasas y umbrales con aviso previo de 15 días.",
    ],
  },
  {
    title: "4. Atribución de ventas",
    paragraphs: [
      "Las ventas se atribuyen mediante el link único del afiliado, que almacena una cookie de 30 días en el navegador del visitante (atribución por último clic), o mediante el código de referido ingresado por el cliente. En caso de conflicto o duda, la decisión de atribución de Caskiuz es definitiva.",
    ],
  },
  {
    title: "5. Disponibilidad de comisiones y reembolsos",
    paragraphs: [
      "La comisión queda disponible de inmediato en el momento en que se cobra el dinero al cliente: al cobrar el anticipo del 50% se acredita la comisión sobre esa mitad, y al cobrar el total se acredita sobre el 100%. Si la venta es reembolsada total o parcialmente, la comisión se anula o ajusta en la misma proporción; si la comisión ya fue pagada al afiliado, el monto correspondiente podrá descontarse de comisiones futuras.",
    ],
  },
  {
    title: "6. Pagos y retiros",
    paragraphs: [
      "Los pagos se realizan en USDT o USDC (redes TRC-20, ERC-20, BEP-20, Solana, Polygon o Arbitrum), Bitcoin (BTC) o Binance Pay (Binance ID o email). Además, según el país de residencia del afiliado: en Venezuela se puede cobrar en bolívares vía Pago Móvil (teléfono, banco, titular y cédula); en Colombia, en pesos vía Nequi, Bancolombia o Daviplata (teléfono o cuenta bancaria y titular); y en Estados Unidos, vía Zelle en dólares (email o teléfono y titular). Las conversiones de moneda local se hacen con la tasa de referencia vigente al momento del pago (promedio del mercado paralelo para bolívares y TRM oficial de Colombia para pesos). El retiro mínimo es de $30 USD. Para el primer retiro se exige verificación de identidad aprobada. El afiliado es responsable de proporcionar una dirección, ID de Binance o datos de cobro correctos; los envíos a destinos incorrectos no son reembolsables. Los retiros se procesan de forma manual y pueden demorar hasta 7 días hábiles.",
    ],
  },
  {
    title: "7. Prácticas prohibidas",
    paragraphs: [
      "Queda prohibido: auto-compra y compras de familiares; tráfico fraudulento o incentivado sin aprobación; spam no solicitado; pujar por la marca Caskiuz o variaciones en buscadores; uso de cookie stuffing u otras técnicas de atribución engañosa; publicidad falsa sobre los servicios o sobre las ganancias del programa; y cualquier actividad ilegal. El incumplimiento conlleva la suspensión de la cuenta y la confiscación de comisiones pendientes.",
    ],
  },
  {
    title: "8. Materiales promocionales",
    paragraphs: [
      "Caskiuz pone a disposición del afiliado banners, textos y guías. Puedes crear tu propio material siempre que no sea engañoso, no dañe la marca y cumpla las leyes aplicables (incluida la obligación de revelar tu relación de afiliado, por ejemplo con #ad o textos equivalentes, cuando lo exija la normativa como las guías de la FTC).",
    ],
  },
  {
    title: "9. Impuestos y cumplimiento",
    paragraphs: [
      "El afiliado es el único responsable de declarar y pagar los impuestos que correspondan a sus comisiones en su jurisdicción. Caskiuz podrá solicitar formularios fiscales (W-8BEN, W-9 o equivalentes) y retener montos cuando la ley lo exija.",
    ],
  },
  {
    title: "10. Terminación y modificaciones",
    paragraphs: [
      "Tanto el afiliado como Caskiuz pueden terminar la relación en cualquier momento con aviso razonable. Las comisiones legítimas devengadas antes de la terminación se pagarán según estas condiciones. Caskiuz puede modificar estos términos notificando con al menos 15 días de anticipación; el uso continuado del programa implica aceptación.",
    ],
  },
];
