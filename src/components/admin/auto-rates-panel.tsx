import { readStoredRate } from "@/lib/exchange-rates";
import { formatCop, formatVes } from "@/lib/payments";
import { AutoRatesRefresh } from "@/components/admin/auto-rates-refresh";

function formatDateLabel(iso: string | null): string {
  if (!iso) return "sin fecha";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "sin fecha";
  return date.toLocaleString("es-VE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function RateCard({
  flag,
  title,
  subtitle,
  value,
  source,
  date,
  stale,
}: {
  flag: string;
  title: string;
  subtitle: string;
  value: string | null;
  source: string | null;
  date: string | null;
  stale: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm font-medium">
        {flag} {title}
      </p>
      <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
      <p className="text-2xl font-bold mt-3">{value ?? "—"}</p>
      {value && !stale ? (
        <p className="text-xs text-green-500 mt-2">
          ✓ Actualizada {date ? `el ${formatDateLabel(date)}` : "automáticamente"}
        </p>
      ) : value ? (
        <p className="text-xs text-yellow-500 mt-2">
          ⚠ Último dato guardado ({formatDateLabel(date)}) — se refresca automáticamente
        </p>
      ) : (
        <p className="text-xs text-yellow-500 mt-2">
          ⚠ Sin datos todavía — se reintenta automáticamente
        </p>
      )}
      {source && <p className="text-xs text-muted-foreground mt-1">Fuente: {source}</p>}
    </div>
  );
}

/**
 * Tarjetas de tasas de cambio automáticas (Ajustes → Métodos de pago).
 * Los valores los actualiza el cron /api/cron/rates y el refresco por visita.
 */
export function AutoRatesPanel({ config }: { config: Record<string, string> }) {
  const ves = readStoredRate(config, "ves");
  const cop = readStoredRate(config, "cop");

  return (
    <section className="glass-card p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">Tasas de cambio automáticas</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Se actualizan solas una vez al día y al entrar aquí si el dato tiene más de 12
            horas. No hay que escribirlas a mano.
          </p>
        </div>
        <AutoRatesRefresh />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <RateCard
          flag="🇻🇪"
          title="Bolívares (USD → Bs)"
          subtitle="Para pagar comisiones por Pago Móvil"
          value={ves.rate ? formatVes(ves.rate) : null}
          source={ves.source}
          date={ves.date}
          stale={ves.stale}
        />
        <RateCard
          flag="🇨🇴"
          title="Pesos colombianos (USD → COP)"
          subtitle="Para pagar comisiones por Nequi, Bancolombia o Daviplata"
          value={cop.rate ? formatCop(cop.rate) : null}
          source={cop.source}
          date={cop.date}
          stale={cop.stale}
        />
      </div>
    </section>
  );
}
