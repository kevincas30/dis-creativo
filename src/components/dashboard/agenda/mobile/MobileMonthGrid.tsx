import { WEEKDAY_LABELS, isSameDay, dayKey } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

const MAX_VISIBLE_DOTS = 4;

// Vista mensual estilo iPhone: solo número + puntos de color por evento, sin
// texto — el detalle se ve al entrar a la vista Día. Toda la celda es el
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
    <div className="liquid-glass overflow-hidden rounded-2xl">
      <div className="border-surface-border grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={`${label}-${index}`} className="text-muted-foreground px-1 py-2 text-center text-xs font-medium tracking-wide uppercase">
            {label}
          </div>
        ))}
      </div>

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
              className="border-surface-border hover:bg-foreground/5 active:bg-foreground/10 flex h-14 flex-col items-center justify-center gap-1 border-r border-b transition-colors duration-150 last:border-r-0"
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-accent text-accent-foreground font-semibold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/40"
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
    </div>
  );
}
