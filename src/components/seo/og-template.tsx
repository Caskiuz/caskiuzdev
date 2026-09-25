/**
 * Plantilla compartida para las imágenes Open Graph (satori / ImageResponse).
 * Todas las miniaturas que se comparten (home, blog, afiliados) usan el mismo
 * ADN visual: fondo oscuro, badge cromado con la "C", hélice de ADN digital
 * azul y tipografía plateada.
 */

const BG = "#0a0a0f";

function helixPolyline(strand: 0 | 1, samples = 72): string {
  const w = 300;
  const h = 300;
  const amp = 58;
  const turns = 2.3;
  const pts: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const angle = t * Math.PI * 2 * turns + (strand === 1 ? Math.PI : 0);
    const x = w / 2 + Math.cos(angle) * amp;
    const y = 14 + t * (h - 28);
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${pts.join(" L ")}`;
}

function helixRungs(): { x1: number; y1: number; x2: number; y2: number }[] {
  const w = 300;
  const h = 300;
  const amp = 58;
  const turns = 2.3;
  const list: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const count = 9;
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 2 * turns;
    const y = 14 + t * (h - 28);
    list.push({
      x1: w / 2 + Math.cos(angle) * amp,
      y1: y,
      x2: w / 2 + Math.cos(angle + Math.PI) * amp,
      y2: y,
    });
  }
  return list;
}

const STRAND_A = helixPolyline(0);
const STRAND_B = helixPolyline(1);
const RUNGS = helixRungs();

export function OgTemplate({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge: string;
}) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        backgroundColor: BG,
        fontFamily: "Geist, Segoe UI, system-ui, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Grid de puntos */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 20px 20px, rgba(59,130,246,0.09) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {/* Brillos azules */}
      <div
        style={{
          position: "absolute",
          top: "-120px",
          left: "-80px",
          width: "560px",
          height: "560px",
          background: "radial-gradient(circle, rgba(59,130,246,0.18) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-160px",
          right: "60px",
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(56,189,248,0.14) 0%, transparent 70%)",
          borderRadius: "50%",
        }}
      />

      {/* Contenido izquierdo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 80,
          paddingRight: 40,
          width: 760,
          position: "relative",
        }}
      >
        {/* Badge cromado con la C */}
        <div
          style={{
            display: "flex",
            width: 92,
            height: 92,
            borderRadius: 24,
            padding: 3,
            background:
              "linear-gradient(140deg, #f8fafc 0%, #9aa7b8 32%, #475569 55%, #e2e8f0 78%, #7c8ba1 100%)",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              borderRadius: 21,
              backgroundColor: "#0b0d14",
              fontSize: 54,
              fontWeight: 900,
              backgroundImage: "linear-gradient(110deg, #f8fafc, #9aa7b8 45%, #64748b 70%, #e2e8f0)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            C
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 42 ? 54 : 64,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-1px",
            background: "linear-gradient(110deg, #f8fafc, #cbd5e1 40%, #94a3b8 65%, #e2e8f0)",
            backgroundClip: "text",
            color: "transparent",
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: "flex",
            marginTop: 22,
            fontSize: 27,
            fontWeight: 600,
            color: "#38bdf8",
            letterSpacing: "0.5px",
          }}
        >
          {subtitle}
        </div>
      </div>

      {/* Hélice de ADN digital dentro de un anillo cromado */}
      <div
        style={{
          position: "absolute",
          right: 70,
          top: "50%",
          marginTop: -170,
          width: 340,
          height: 340,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          border: "12px solid #8fa0b5",
          boxShadow: "0 0 70px rgba(56,189,248,0.35), inset 0 0 50px rgba(148,163,184,0.35)",
        }}
      >
        <svg width="300" height="300" viewBox="0 0 300 300">
          {RUNGS.map((r, i) => (
            <line
              key={i}
              x1={r.x1}
              y1={r.y1}
              x2={r.x2}
              y2={r.y2}
              stroke="#38bdf8"
              strokeWidth={1.6}
              opacity={0.35}
            />
          ))}
          <path d={STRAND_A} stroke="#e2e8f0" strokeWidth={4.5} fill="none" opacity={0.85} strokeLinecap="round" />
          <path d={STRAND_B} stroke="#38bdf8" strokeWidth={4.5} fill="none" opacity={0.95} strokeLinecap="round" />
        </svg>
      </div>

      {/* Badge inferior */}
      <div
        style={{
          position: "absolute",
          bottom: 54,
          left: 80,
          display: "flex",
          padding: "10px 24px",
          borderRadius: 999,
          background: "linear-gradient(135deg, #1e3a8a, #0ea5e9)",
          color: "#ffffff",
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "1px",
        }}
      >
        {badge}
      </div>

      {/* Borde interior */}
      <div
        style={{
          position: "absolute",
          inset: 22,
          borderRadius: 36,
          border: "1px solid rgba(59,130,246,0.22)",
        }}
      />
    </div>
  );
}
