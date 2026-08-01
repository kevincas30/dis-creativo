import Link from "next/link";
import { QUOTE_STATUS_CONFIG } from "@/lib/quote-status";
import type { ActivityEventData } from "@/lib/activity";

const EVENT_LABELS: Record<ActivityEventData["type"], string> = {
  created: "Creado",
  DRAFT: "Pendiente",
  SENT: "Enviado",
  ACCEPTED: "Aprobado",
  REJECTED: "Rechazado",
  ARCHIVED: "Archivado",
  PAID: "Pagado",
};

function formatRelative(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} d`;
}

export default function RecentActivityCard({ events }: { events: ActivityEventData[] }) {
  return (
    <div className="liquid-glass animate-fade-in-up flex h-full w-full flex-col rounded-2xl p-4" style={{ animationDelay: "260ms" }}>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Actividad reciente</h3>

      <div className="flex-1">
        {events.length === 0 ? (
          <p className="text-muted-foreground py-3 text-sm">Sin actividad todavía.</p>
        ) : (
          <div className="divide-surface-border divide-y">
            {events.map((event) => {
              const config = event.type === "created" ? null : QUOTE_STATUS_CONFIG[event.type];
              return (
                <div key={event.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${
                      config ? config.badgeClassName : "border-surface-border text-muted-foreground"
                    }`}
                  >
                    {config ? <span className={`h-1.5 w-1.5 rounded-full ${config.dotClassName}`} /> : null}
                    {EVENT_LABELS[event.type]}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{event.clientName}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{formatRelative(event.at)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-2 flex justify-end">
        <Link href="/agenda" className="text-accent hover:opacity-80 text-xs font-medium transition-opacity">
          Ver toda la actividad
        </Link>
      </div>
    </div>
  );
}
