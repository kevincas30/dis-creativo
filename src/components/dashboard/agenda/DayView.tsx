import { MapPin } from "lucide-react";
import { formatTime } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function DayView({ events }: { events: EventSnapshot[] }) {
  if (events.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">No hay eventos este día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const config = EVENT_TYPE_CONFIG[event.type];
        return (
          <div
            key={event.id}
            className="liquid-glass flex items-start gap-3 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-px"
            style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
          >
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
                {formatTime(new Date(event.startAt))} – {formatTime(new Date(event.endAt))}
                {event.client ? ` · ${event.client.name}` : ""}
                {event.project ? ` · ${event.project.name}` : ""}
              </p>
              {event.location ? (
                <p className="text-muted-foreground mt-1.5 flex items-center gap-1 text-xs">
                  <MapPin className="h-3 w-3 shrink-0" strokeWidth={1.75} />
                  {event.location}
                </p>
              ) : null}
              {event.notes ? <p className="text-foreground/80 mt-1.5 text-xs whitespace-pre-wrap">{event.notes}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
