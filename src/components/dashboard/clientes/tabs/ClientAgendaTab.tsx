import { MapPin } from "lucide-react";
import { formatTime } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function ClientAgendaTab({ events }: { events: EventSnapshot[] }) {
  if (events.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">Este cliente todavía no tiene eventos en la agenda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const config = EVENT_TYPE_CONFIG[event.type];
        const startDate = new Date(event.startAt);
        return (
          <div key={event.id} className="liquid-glass flex items-start gap-3 rounded-2xl p-4">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${config.iconBgClassName}`}>
              <config.icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{event.title}</p>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badgeClassName}`}>
                  {config.label}
                </span>
              </div>
              <p className="text-muted-foreground mt-0.5 text-xs">
                {new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(startDate)} ·{" "}
                {formatTime(startDate)} – {formatTime(new Date(event.endAt))}
              </p>
              {event.location ? (
                <p className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  {event.location}
                </p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
