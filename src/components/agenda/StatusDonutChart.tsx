import type { QuoteStatus } from "@/generated/prisma/enums";
import { AGENDA_STATUS_COLORS, AGENDA_STATUS_ORDER } from "./agenda-colors";

const SIZE = 120;
const STROKE = 16;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Mismos tonos que agenda-colors.ts, pero en hex — un atributo SVG como
// `stroke` no puede tomar una clase de Tailwind.
const STROKE_HEX: Record<QuoteStatus, string> = {
  DRAFT: "#fbbf24",
  SENT: "#60a5fa",
  ACCEPTED: "#34d399",
  PAID: "#22d3ee",
  REJECTED: "#f87171",
  ARCHIVED: "#a1a1aa",
};

export default function StatusDonutChart({ counts }: { counts: Partial<Record<QuoteStatus, number>> }) {
  const total = AGENDA_STATUS_ORDER.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  if (total === 0) {
    return <p className="text-muted-foreground text-sm">Todavía no hay presupuestos.</p>;
  }

  const lengths = AGENDA_STATUS_ORDER.map((status) => ((counts[status] ?? 0) / total) * CIRCUMFERENCE);
  const segments = AGENDA_STATUS_ORDER.map((status, index) => ({
    status,
    length: lengths[index],
    offset: lengths.slice(0, index).reduce((sum, length) => sum + length, 0),
  })).filter((segment) => segment.length > 0);

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="currentColor" className="text-white/5" strokeWidth={STROKE} />
          {segments.map((segment) => (
            <circle
              key={segment.status}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={STROKE_HEX[segment.status]}
              strokeWidth={STROKE}
              strokeDasharray={`${segment.length} ${CIRCUMFERENCE - segment.length}`}
              strokeDashoffset={-segment.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-semibold">{total}</span>
          <span className="text-muted-foreground text-[10px]">total</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        {AGENDA_STATUS_ORDER.filter((status) => (counts[status] ?? 0) > 0).map((status) => (
          <div key={status} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${AGENDA_STATUS_COLORS[status].dot}`} />
            <span className="text-muted-foreground">{AGENDA_STATUS_COLORS[status].label}</span>
            <span className="font-medium">{counts[status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
