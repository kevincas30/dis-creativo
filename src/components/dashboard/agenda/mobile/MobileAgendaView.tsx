"use client";

import { useMemo, useState } from "react";
import { CalendarDays, MoreHorizontal } from "lucide-react";
import { formatDayLabel } from "@/lib/dashboard-agenda-dates";
import { madridTime } from "@/lib/agenda-time";
import MobileDayView from "@/components/dashboard/agenda/mobile/MobileDayView";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

function dateFromKey(key: string) {
  return new Date(`${key}T12:00:00`);
}

/** A compact chronological agenda keeps the detailed timeline one tap away. */
export default function MobileAgendaView({ eventsByDay, onOpenItem, onMoreItem }: { eventsByDay: Map<string, AgendaItemSnapshot[]>; onOpenItem?: (event: AgendaItemSnapshot) => void; onMoreItem?: (click: React.MouseEvent, event: AgendaItemSnapshot) => void }) {
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const days = useMemo(() => [...eventsByDay.entries()].map(([key, events]) => ({ key, date: dateFromKey(key), events })).sort((a, b) => a.key.localeCompare(b.key)), [eventsByDay]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="animate-fade-in-up shrink-0 px-1 pb-3">
        <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
        <p className="text-muted-foreground mt-1 text-sm">Todo el equipo</p>
      </div>
      <div className="flex-1 space-y-6 overflow-y-auto pb-4">
        {days.length === 0 ? <p className="text-muted-foreground px-1 py-10 text-center text-sm">No hay elementos para mostrar.</p> : days.map(({ key, date, events }) => (
          <section key={key} aria-label={formatDayLabel(date)}>
            <button type="button" onClick={() => setDayViewDate(date)} className="text-muted-foreground hover:text-foreground focus-visible:ring-accent/40 flex w-full cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-left text-xs font-semibold tracking-wide uppercase focus-visible:ring-2 focus-visible:outline-none">
              <CalendarDays className="h-4 w-4" />{formatDayLabel(date)}
            </button>
            <div className="border-surface-border mt-2 overflow-hidden rounded-xl border">
              {events.map((event) => (
                <div key={event.id} className="border-surface-border flex min-h-12 items-center gap-3 border-b px-3 last:border-b-0">
                  <button type="button" onClick={() => onOpenItem?.(event)} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-3 text-left focus-visible:outline-none">
                    <span className="bg-accent h-2 w-2 shrink-0 rounded-full" aria-hidden="true" />
                    <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{event.title}</span><span className="text-muted-foreground block text-xs">{event.allDay ? "Todo el día" : madridTime(new Date(event.startAt))}</span></span>
                  </button>
                  <button type="button" aria-label="Más acciones" onClick={(click) => onMoreItem?.(click, event)} className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground focus-visible:ring-accent/40 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg focus-visible:ring-2 focus-visible:outline-none"><MoreHorizontal className="h-5 w-5" /></button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
      {dayViewDate ? <MobileDayView date={dayViewDate} eventsByDay={eventsByDay} onClose={() => setDayViewDate(null)} onChangeDay={setDayViewDate} onOpenItem={onOpenItem} onMoreItem={onMoreItem} /> : null}
    </div>
  );
}
