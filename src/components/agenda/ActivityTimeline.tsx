import Link from "next/link";
import { FileText, Send, CheckCircle2, Banknote, XCircle, Archive } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ActivityEventData } from "@/lib/activity";

const EVENT_CONFIG: Record<ActivityEventData["type"], { label: string; icon: LucideIcon }> = {
  created: { label: "Presupuesto creado", icon: FileText },
  DRAFT: { label: "Marcado como pendiente", icon: FileText },
  READY_TO_SEND: { label: "Listo para enviar", icon: FileText },
  SENT: { label: "Enviado", icon: Send },
  ACCEPTED: { label: "Aprobado", icon: CheckCircle2 },
  PAID: { label: "Pagado", icon: Banknote },
  REJECTED: { label: "Rechazado", icon: XCircle },
  EXPIRED: { label: "Vencido", icon: XCircle },
  ARCHIVED: { label: "Archivado", icon: Archive },
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
  return `hace ${diffDays} d`;
}

export default function ActivityTimeline({ events }: { events: ActivityEventData[] }) {
  if (events.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin actividad todavía.</p>;
  }

  return (
    <div className="space-y-1">
      {events.map((event) => {
        const config = EVENT_CONFIG[event.type];
        return (
          <Link
            key={event.id}
            href={`/presupuestos/quotes/${event.quoteId}`}
            className="hover:bg-foreground/5 flex items-center gap-3 rounded-xl px-2 py-1.5 text-sm transition-colors"
          >
            <span className="bg-accent-soft flex h-7 w-7 shrink-0 items-center justify-center rounded-full">
              <config.icon className="text-foreground h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1 truncate">
              {config.label} <span className="text-muted-foreground">— {event.clientName}</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">{formatRelative(event.at)}</span>
          </Link>
        );
      })}
    </div>
  );
}
