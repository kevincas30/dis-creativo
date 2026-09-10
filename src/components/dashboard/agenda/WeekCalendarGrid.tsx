import { isSameDay, dayKey } from "@/lib/dashboard-agenda-dates";
import EventChip from "@/components/dashboard/agenda/EventChip";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

const WEEKDAY_FULL_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default function WeekCalendarGrid({
  days,
  eventsByDay,
  selectedDay,
  onSelectDay,
}: {
  days: Date[];
  eventsByDay: Map<string, AgendaItemSnapshot[]>;
  selectedDay: Date;
  onSelectDay: (date: Date) => void;
}) {
  const today = new Date();

  return (
    <div className="liquid-glass grid grid-cols-1 overflow-hidden rounded-2xl sm:grid-cols-7">
      {days.map((day, index) => {
        const key = dayKey(day);
        const dayEvents = eventsByDay.get(key) ?? [];
        const isToday = isSameDay(day, today);
        const isSelected = isSameDay(day, selectedDay);

        return (
          <button
            type="button"
            key={key}
            onClick={() => onSelectDay(day)}
            className={`border-surface-border hover:bg-foreground/5 flex min-h-32 w-full flex-col gap-1.5 border-r border-b p-2 text-left transition-colors duration-150 last:border-r-0 sm:border-b-0 ${
              isSelected ? "bg-accent-soft" : ""
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{WEEKDAY_FULL_LABELS[index]}</span>
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-accent text-accent-foreground font-semibold" : "text-foreground"
                }`}
              >
                {day.getDate()}
              </span>
            </div>

            <div className="space-y-1">
              {dayEvents.length === 0 ? (
                <p className="text-muted-foreground/60 text-[11px]">Sin eventos</p>
              ) : (
                dayEvents.map((event) => <EventChip key={event.id} event={event} />)
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
