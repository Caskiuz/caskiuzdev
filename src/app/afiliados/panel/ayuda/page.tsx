import { requireAffiliate } from "@/lib/affiliate-auth";
import { AFFILIATE_FAQS } from "@/lib/affiliate-content";
import Link from "next/link";
import {
  BookOpen,
  Link2,
  Megaphone,
  MousePointerClick,
  ShoppingCart,
  Wallet,
  Calculator,
  LayoutDashboard,
  LifeBuoy,
  Info,
} from "lucide-react";

const QUICK_GUIDES = [
  {
    title: "Primeros pasos",
    steps: [
      "Ve a 'Mis enlaces' y copia tu link único.",
      "Elige un destino (recomendado: sección de servicios).",
      "Agrega un sub-ID para identificar tu campaña (ej: 'instagram').",
      "Comparte el link en tus redes y comunidades.",
    ],
  },
  {
    title: "Cómo cobrar",
    steps: [
      "Sube tu documento de identidad en 'Documentos' y espera la aprobación.",
      "Registra tu método de pago en 'Retiros' (Binance Pay, wallet o Pago Móvil).",
      "Cuando tengas $30 USD o más en saldo disponible, solicita el retiro.",
      "Recibirás tu pago en un máximo de 7 días hábiles.",
    ],
  },
  {
    title: "Cómo subir de nivel",
    steps: [
      "Nivel Plata: 10% desde tu primera venta.",
      "Nivel Oro (20%): acumula $2,000 USD en ventas referidas cobradas.",
      "Nivel Platino (30%): acumula $5,000 USD.",
      "Nivel Diamante (40%): acumula $15,000 USD.",
    ],
  },
];

const SALE_STATUSES = [
  { status: "Lead", meaning: "El cliente llegó y preguntó, aún no paga nada." },
  { status: "Anticipo pagado", meaning: "El cliente pagó el 50% para arrancar el proyecto." },
  { status: "Pagado completo", meaning: "El cliente pagó el 100% (anticipo + entrega)." },
  { status: "Reembolsado", meaning: "Se devolvió el dinero: la comisión se anula." },
];

const COMMISSION_STATES = [
  { state: "En retención", meaning: "La venta se cobró y estás dentro de los 30 días anti-reembolso." },
  { state: "Disponible", meaning: "Ya puedes retirarla (mínimo acumulado de $30 USD)." },
  { state: "En retiro", meaning: "Solicitaste el pago y está en proceso." },
  { state: "Pagada", meaning: "Ya te pagamos: ves el hash de la transacción en tu historial." },
  { state: "Reversada", meaning: "La venta fue reembolsada y la comisión se anuló." },
];

function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="metal-card rounded-2xl p-6">
      <h2 className="font-bold mb-4 flex items-center gap-2">
        <Icon className="w-5 h-5 text-aff-cyan" /> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function NumberedSteps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
          <span className="w-6 h-6 rounded-full bg-aff-blue/15 text-aff-cyan flex items-center justify-center text-xs font-bold shrink-0">
            {i + 1}
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export default async function HelpPage() {
  const affiliate = await requireAffiliate();
  const baseUrl = "https://caskiuz.vercel.app";
  const ref = affiliate.slug || affiliate.referralCode;
  const link = `${baseUrl}/r/${ref}`;

  const campaignExamples = [
    { channel: "Instagram", url: `${baseUrl}/r/${ref}?subid=instagram` },
    { channel: "WhatsApp", url: `${baseUrl}/r/${ref}?subid=whatsapp` },
    { channel: "TikTok", url: `${baseUrl}/r/${ref}?subid=tiktok` },
    { channel: "YouTube", url: `${baseUrl}/r/${ref}?subid=youtube` },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-aff-cyan" /> Ayuda y guías
        </h1>
        <p className="text-muted-foreground mt-1">
          Todo lo que necesitas saber para empezar a facturar con Caskiuz.
        </p>
      </div>

      {/* Guía rápida */}
      <div className="grid lg:grid-cols-3 gap-5">
        {QUICK_GUIDES.map((guide) => (
          <div key={guide.title} className="glass-card rounded-2xl p-6">
            <h2 className="font-bold mb-4">{guide.title}</h2>
            <NumberedSteps items={guide.steps} />
          </div>
        ))}
      </div>

      <h2 className="text-xl font-bold pt-2">Cómo funciona todo, paso a paso</h2>

      {/* 1. Tu link */}
      <SectionCard icon={Link2} title="1. Tu link único">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Este es tu link personal. Todo lo que pase después de un clic en él queda
          registrado a tu nombre:
        </p>
        <code className="block px-4 py-3 rounded-xl bg-surface-hover border border-border text-sm font-mono text-aff-cyan break-all">
          {link}
        </code>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cuando alguien hace clic, el sistema registra el clic, le instala una{" "}
          <strong className="text-foreground">cookie de 30 días</strong> que lo vincula
          contigo y lo redirige a la web. Si esa persona contrata dentro de esos 30 días,
          la venta es tuya — aunque no compre el mismo día. Si hace clic en el link de otro
          afiliado después, gana el último clic (así funciona en todas las redes de afiliados).
        </p>
        <p className="text-xs text-muted-foreground">
          💡 En «Mis enlaces» puedes elegir a qué página llega el visitante: inicio,
          servicios, formulario de contacto o blog.
        </p>
      </SectionCard>

      {/* 2. Campañas */}
      <SectionCard icon={Megaphone} title="2. Las campañas (sub-IDs)">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Una campaña es simplemente una <strong className="text-foreground">etiqueta</strong>{" "}
          que le agregas a tu link para saber de qué canal vino cada persona. Es el mismo
          link, con una etiqueta distinta por red social:
        </p>
        <div className="space-y-2">
          {campaignExamples.map((campaign) => (
            <div
              key={campaign.channel}
              className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm p-3 rounded-xl bg-surface-hover border border-border"
            >
              <span className="font-semibold w-20 shrink-0">{campaign.channel}</span>
              <code className="font-mono text-xs text-aff-cyan break-all">{campaign.url}</code>
            </div>
          ))}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          En «Mis enlaces» ves la tabla <strong className="text-foreground">Clics por sub-ID</strong>:
          ahí sabrás si Instagram te da 40 clics y WhatsApp 15, por ejemplo. La campaña{" "}
          <strong className="text-foreground">no cambia tu comisión</strong>: solo te mide qué
          canal te funciona mejor.
        </p>
      </SectionCard>

      {/* 3. Recorrido del cliente */}
      <SectionCard icon={MousePointerClick} title="3. El recorrido de tu cliente">
        <NumberedSteps
          items={[
            "La persona hace clic en tu link y queda vinculada a ti por 30 días.",
            "Llena el formulario de contacto (o escribe por WhatsApp y menciona tu código de referido).",
            "Automáticamente ese contacto queda marcado como tuyo: es un lead tuyo.",
            "En tu dashboard ves subir el contador «Leads referidos»: señal de que tu promoción funciona.",
          ]}
        />
      </SectionCard>

      {/* 4. La venta */}
      <SectionCard icon={ShoppingCart} title="4. La venta y sus estados">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Los servicios se venden por conversación (no hay carrito de compra). El dueño de
          Caskiuz registra la venta cuando el cliente paga, y tú la ves aparecer en tu
          sección «Comisiones» con uno de estos estados:
        </p>
        <div className="space-y-2">
          {SALE_STATUSES.map((item) => (
            <div
              key={item.status}
              className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm p-3 rounded-xl bg-surface-hover border border-border"
            >
              <span className="font-semibold w-36 shrink-0 text-foreground">{item.status}</span>
              <span className="text-muted-foreground">{item.meaning}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Así sigues el proceso completo del proyecto: cuando aparece «Anticipo pagado»
          significa que el cliente ya pagó para arrancar, y «Pagado completo» que el
          proyecto quedó saldado.
        </p>
      </SectionCard>

      {/* 5. Cobro */}
      <SectionCard icon={Wallet} title="5. Cómo y cuándo cobras">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Tu comisión se calcula <strong className="text-foreground">solo sobre dinero
          realmente cobrado</strong> (nadie pierde por proyectos que no se pagan):
        </p>
        <NumberedSteps
          items={[
            "El cliente paga el 50% de anticipo: tu comisión se calcula sobre esa mitad y entra en retención.",
            "El cliente paga el 50% restante: la comisión se recalcula sobre el total y arranca el reloj de 30 días anti-reembolso.",
            "A los 30 días la comisión pasa sola a «Disponible».",
            "Con $30 USD o más disponibles vas a «Retiros», registras tu método y solicitas el pago (un retiro a la vez).",
            "Recibes tu pago y ves el hash de la transacción en tu historial.",
          ]}
        />
        <div className="space-y-2 pt-2">
          {COMMISSION_STATES.map((item) => (
            <div
              key={item.state}
              className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm p-3 rounded-xl bg-surface-hover border border-border"
            >
              <span className="font-semibold w-36 shrink-0 text-aff-cyan">{item.state}</span>
              <span className="text-muted-foreground">{item.meaning}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          Métodos de pago: USDT o USDC (6 redes), Bitcoin, Binance Pay y — si estás en
          Venezuela — bolívares por Pago Móvil. La verificación de identidad (KYC) es
          requisito para el primer retiro.
        </p>
      </SectionCard>

      {/* 6. Ejemplo */}
      <SectionCard icon={Calculator} title="6. Ejemplo completo con números">
        <div className="rounded-xl bg-aff-blue/5 border border-aff-blue/15 p-4">
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Eres afiliado <strong className="text-foreground">Plata (10%)</strong> y compartes
            tu link en Instagram con <code className="font-mono text-xs">?subid=instagram</code>.
          </p>
          <NumberedSteps
            items={[
              "25 personas hacen clic → tu dashboard muestra 25 clics.",
              "Una llena el formulario → 1 lead (tasa de conversión del 4%).",
              "Cotizas una tienda online de $999. El cliente paga el anticipo de $499.50 → ganas 10% = $49.95, en retención.",
              "Al entregar, el cliente paga el resto: cobrado $999 → tu comisión se recalcula a $99.90 y arranca la retención de 30 días.",
              "A los 30 días: $99.90 disponibles. Superas el mínimo de $30, solicitas el retiro y te pagan por Binance Pay.",
            ]}
          />
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Y cuando acumules $2,000 en ventas cobradas subes a <strong className="text-foreground">Oro
          (20%)</strong>: esa misma tienda de $999 te dejaría $199.80. En Platino (30%) serían
          $299.70 y en Diamante (40%), $399.60.
        </p>
      </SectionCard>

      {/* 7. Panel */}
      <SectionCard icon={LayoutDashboard} title="7. Qué ves en tu panel">
        <div className="space-y-2">
          {[
            ["Dashboard", "Clics, leads, ventas, conversión, EPC, saldo disponible y en retención, y tu progreso al siguiente nivel."],
            ["Mis enlaces", "Tu link, el generador con destinos y campañas, y el rendimiento por sub-ID."],
            ["Catálogo", "Los servicios, sus precios y cuánto ganas con cada uno según tu nivel."],
            ["Materiales", "Textos listos para copiar y pegar en WhatsApp y redes."],
            ["Comisiones", "Cada venta con su estado y lo que ganaste."],
            ["Retiros", "Tu saldo, tus métodos de pago y el historial con hashes."],
            ["Documentos", "Tu verificación de identidad (KYC)."],
            ["Soporte", "Tickets para resolver cualquier duda con el equipo."],
          ].map(([section, description]) => (
            <div
              key={section}
              className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-sm p-3 rounded-xl bg-surface-hover border border-border"
            >
              <span className="font-semibold w-36 shrink-0 text-foreground">{section}</span>
              <span className="text-muted-foreground">{description}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground flex items-start gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Hoy las novedades de tus ventas se ven directamente en el panel. Los emails
          automáticos se envían cuando aprueban tu KYC, cuando cambia el estado de un
          retiro y en las respuestas de soporte.
        </p>
      </SectionCard>

      {/* FAQ */}
      <div className="metal-card rounded-2xl p-6">
        <h2 className="font-bold mb-4">Preguntas frecuentes</h2>
        <div className="space-y-2">
          {AFFILIATE_FAQS.map((faq) => (
            <details key={faq.q} className="rounded-xl bg-surface-hover border border-border group">
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-4 text-sm font-semibold">
                {faq.q}
                <span className="text-aff-cyan shrink-0 transition-transform group-open:rotate-180">▾</span>
              </summary>
              <p className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <LifeBuoy className="w-6 h-6 text-aff-cyan" />
          <p className="text-sm text-muted-foreground">
            ¿No encuentras la respuesta? Nuestro equipo de soporte está para ayudarte.
          </p>
        </div>
        <Link href="/afiliados/panel/soporte" className="btn-aff metal-shine px-5 py-2.5 text-sm">
          Abrir ticket de soporte
        </Link>
      </div>
    </div>
  );
}
