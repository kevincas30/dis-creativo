import { formatDayLabel, formatTime, isSameDay } from "@/lib/dashboard-agenda-dates";
import EventRow from "@/components/dashboard/agenda/EventRow";
import type { EventSnapshot } from "@/lib/event-presenter";

export type AgendaListDay = { date: Date; events: EventSnapshot[] };

export default function AgendaListView({ days, onSelectDay }: { days: AgendaListDay[]; onSelectDay: (date: Date) => void }) {
  if (days.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">No hay eventos este mes.</p>
      </div>
    );
  }

  const today = new Date();

  return (
    <div className="space-y-4">
      {days.map(({ date, events }) => (
        <div key={date.toISOString()} className="liquid-glass rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{formatDayLabel(date)}</h3>
            {isSameDay(date, today) ? (
              <span className="bg-accent text-accent-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">Hoy</span>
            ) : null}
          </div>

          <div className="divide-surface-border mt-1 divide-y">
            {events.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                metaLine={`${formatTime(new Date(event.startAt))} – ${formatTime(new Date(event.endAt))}`}
                onClick={() => onSelectDay(date)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
