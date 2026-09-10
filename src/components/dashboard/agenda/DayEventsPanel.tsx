import { formatDayLabel, formatTime, isSameDay } from "@/lib/dashboard-agenda-dates";
import EventRow from "@/components/dashboard/agenda/EventRow";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export default function DayEventsPanel({ date, events }: { date: Date; events: AgendaItemSnapshot[] }) {
  const isToday = isSameDay(date, new Date());

  return (
    <div className="liquid-glass animate-fade-in-up rounded-2xl p-4" style={{ animationDelay: "120ms" }}>
      <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Eventos del día</h3>
      <p className="mt-0.5 text-sm font-medium">{formatDayLabel(date)}</p>

      {events.length === 0 ? (
        <p className="text-muted-foreground mt-3 py-3 text-sm">{isToday ? "Aún no hay eventos hoy." : "Aún no hay eventos este día."}</p>
      ) : (
        <div className="divide-surface-border mt-2 divide-y">
          {events.map((event) => (
            <EventRow key={event.id} event={event} metaLine={`${formatTime(new Date(event.startAt))} – ${formatTime(new Date(event.endAt))}`} />
          ))}
        </div>
      )}
    </div>
  );
}
