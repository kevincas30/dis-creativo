import { WEEKDAY_LABELS, isSameDay, dayKey } from "@/lib/dashboard-agenda-dates";
import EventChip from "@/components/dashboard/agenda/EventChip";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

const MAX_VISIBLE_PER_DAY = 3;

export default function MonthCalendarGrid({
  days,
  referenceDate,
  eventsByDay,
  selectedDay,
  onSelectDay,
  onContextMenu,
  onOpenItem,
  onMoveItem,
}: {
  days: Date[];
  referenceDate: Date;
  eventsByDay: Map<string, AgendaItemSnapshot[]>;
  selectedDay: Date;
  onSelectDay: (date: Date) => void;
  onContextMenu?: (event: React.MouseEvent | React.KeyboardEvent, item: AgendaItemSnapshot | null, date: Date) => void;
  onOpenItem?: (item: AgendaItemSnapshot) => void;
  onMoveItem?: (item: AgendaItemSnapshot, date: Date) => void;
}) {
  const today = new Date();

  return (
    <div className="liquid-glass overflow-hidden rounded-2xl">
      <div className="border-surface-border grid grid-cols-7 border-b">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={`${label}-${index}`} className="text-muted-foreground px-2 py-2 text-center text-xs font-medium tracking-wide uppercase">
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
          const isSelected = isSameDay(day, selectedDay);
          const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_PER_DAY);
          const extraCount = dayEvents.length - visibleEvents.length;

          return (
            <div
              role="button"
              tabIndex={0}
              key={key}
              onClick={() => onSelectDay(day)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { const raw = event.dataTransfer.getData("application/x-agenda-item"); if (raw) onMoveItem?.(JSON.parse(raw) as AgendaItemSnapshot, day); }}
              onContextMenu={(event) => onContextMenu?.(event, null, day)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onSelectDay(day); } if ((event.shiftKey && event.key === "F10") || event.key === "ContextMenu") { event.preventDefault(); onContextMenu?.(event, null, day); } }}
              className={`border-surface-border hover:bg-foreground/5 flex min-h-24 w-full flex-col gap-1 border-r border-b p-1.5 text-left transition-colors duration-150 last:border-r-0 ${
                isSelected ? "bg-accent-soft" : ""
              }`}
            >
              <span
                className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                  isToday ? "bg-accent text-accent-foreground font-semibold" : isCurrentMonth ? "text-foreground" : "text-muted-foreground/50"
                }`}
              >
                {day.getDate()}
              </span>

              <div className="space-y-1">
                {visibleEvents.map((event) => (
                  <EventChip key={event.id} event={event} onOpen={onOpenItem} onDragStart={(drag, item) => { drag.dataTransfer.setData("application/x-agenda-item", JSON.stringify(item)); drag.dataTransfer.effectAllowed = "move"; }} onContextMenu={(click, item) => onContextMenu?.(click, item, day)} />
                ))}
                {extraCount > 0 ? <p className="text-muted-foreground px-1 text-[11px]">+{extraCount} más</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
