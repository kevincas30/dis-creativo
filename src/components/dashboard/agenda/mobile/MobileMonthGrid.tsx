import { isSameDay, dayKey } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

const MAX_VISIBLE_DOTS = 4;

// Grilla de un solo mes, sin card ni encabezado de días (eso vive una sola
// vez, fijo, en MobileAgendaView) — pensado para apilarse en un scroll
// continuo de varios meses, estilo Calendario de iPhone. Toda la celda es el
// área táctil (día vacío o con eventos, da igual: siempre abre la vista Día).
export default function MobileMonthGrid({
  days,
  referenceDate,
  eventsByDay,
  onSelectDay,
}: {
  days: Date[];
  referenceDate: Date;
  eventsByDay: Map<string, EventSnapshot[]>;
  onSelectDay: (date: Date) => void;
}) {
  const today = new Date();

  return (
    <div className="grid grid-cols-7">
      {days.map((day) => {
        const key = dayKey(day);
        const dayEvents = eventsByDay.get(key) ?? [];
        const isCurrentMonth = day.getMonth() === referenceDate.getMonth();
        const isToday = isSameDay(day, today);
        const visibleDots = dayEvents.slice(0, MAX_VISIBLE_DOTS);

        return (
          <button
            type="button"
            key={key}
            onClick={() => onSelectDay(day)}
            className="active:bg-foreground/5 flex h-14 flex-col items-center justify-center gap-1 rounded-xl transition-colors duration-150"
          >
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm ${
                isToday ? "bg-accent text-accent-foreground font-semibold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/30"
              }`}
            >
              {day.getDate()}
            </span>
            <span className="flex h-1.5 items-center gap-0.5">
              {visibleDots.map((event) => (
                <span key={event.id} className={`h-1 w-1 rounded-full ${EVENT_TYPE_CONFIG[event.type].dot}`} />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}
