"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import AgendaHeader from "@/components/dashboard/agenda/AgendaHeader";
import MonthCalendarGrid from "@/components/dashboard/agenda/MonthCalendarGrid";
import WeekCalendarGrid from "@/components/dashboard/agenda/WeekCalendarGrid";
import DayView from "@/components/dashboard/agenda/DayView";
import AgendaListView, { type AgendaListDay } from "@/components/dashboard/agenda/AgendaListView";
import DayEventsPanel from "@/components/dashboard/agenda/DayEventsPanel";
import AgendaEmptyState from "@/components/dashboard/agenda/AgendaEmptyState";
import CreateEventModal from "@/components/dashboard/agenda/CreateEventModal";
import MobileAgendaView from "@/components/dashboard/agenda/mobile/MobileAgendaView";
import { useMobileHeaderAction } from "@/components/dashboard/MobileHeaderActionContext";
import {
  addDays,
  addMonths,
  addWeeks,
  dayKey,
  formatDayLabel,
  formatMonthLabel,
  formatWeekRangeLabel,
  getMonthGridDays,
  getWeekDays,
  toDateInputValue,
} from "@/lib/dashboard-agenda-dates";
import type { EventSnapshot } from "@/lib/event-presenter";

export type AgendaView = "month" | "week" | "day" | "list";

export default function AgendaPageClient({
  initialEvents,
  clients,
  projects,
}: {
  initialEvents: EventSnapshot[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<AgendaView>("month");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  useMobileHeaderAction(
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      aria-label="Nuevo evento"
      className="shadow-soft flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform duration-150 active:scale-[0.92]"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
    </button>,
  );

  const eventsByDay = useMemo(() => {
    const map = new Map<string, EventSnapshot[]>();
    for (const event of events) {
      const key = dayKey(new Date(event.startAt));
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    return map;
  }, [events]);

  // Vista Día: eventos del día que se está navegando (referenceDate).
  const referenceDayEvents = useMemo(
    () => eventsByDay.get(dayKey(referenceDate)) ?? [],
    [eventsByDay, referenceDate],
  );

  // Panel lateral: eventos del día seleccionado en el calendario (Mes/Semana/Lista),
  // o del mismo día que la vista Día cuando esa es la vista activa.
  const panelDate = view === "day" ? referenceDate : selectedDay;
  const panelDayEvents = view === "day" ? referenceDayEvents : (eventsByDay.get(dayKey(selectedDay)) ?? []);

  // Vista Lista: solo los días del mes de referenceDate que tienen al menos un evento.
  const listViewDays = useMemo<AgendaListDay[]>(() => {
    const days: AgendaListDay[] = [];
    for (const dayEvents of eventsByDay.values()) {
      const first = dayEvents[0];
      if (!first) continue;
      const date = new Date(first.startAt);
      date.setHours(0, 0, 0, 0);
      if (date.getMonth() !== referenceDate.getMonth() || date.getFullYear() !== referenceDate.getFullYear()) continue;
      days.push({ date, events: dayEvents });
    }
    return days.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [eventsByDay, referenceDate]);

  function handleCreated(created: EventSnapshot) {
    setEvents((prev) => [...prev, created]);
  }

  function handleSelectDay(day: Date) {
    setSelectedDay(day);
  }

  function handleViewChange(nextView: AgendaView) {
    if (nextView === "day") {
      // Al entrar a la vista Día, se centra en el día que estaba seleccionado.
      setReferenceDate(selectedDay);
    } else if (view === "day") {
      // Al salir de la vista Día, el panel sigue mostrando ese mismo día.
      setSelectedDay(referenceDate);
    }
    setView(nextView);
  }

  function handlePrev() {
    if (view === "week") setReferenceDate((prev) => addWeeks(prev, -1));
    else if (view === "day") setReferenceDate((prev) => addDays(prev, -1));
    else setReferenceDate((prev) => addMonths(prev, -1));
  }

  function handleNext() {
    if (view === "week") setReferenceDate((prev) => addWeeks(prev, 1));
    else if (view === "day") setReferenceDate((prev) => addDays(prev, 1));
    else setReferenceDate((prev) => addMonths(prev, 1));
  }

  function handleToday() {
    const now = new Date();
    setReferenceDate(now);
    setSelectedDay(now);
  }

  const referenceLabel =
    view === "week"
      ? formatWeekRangeLabel(getWeekDays(referenceDate))
      : view === "day"
        ? formatDayLabel(referenceDate)
        : formatMonthLabel(referenceDate);

  if (events.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">Agenda comercial</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organiza reuniones, entregas y seguimientos del estudio</p>
        </div>
        <AgendaEmptyState onCreate={() => setIsCreateOpen(true)} />
        <CreateEventModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} clients={clients} projects={projects} onCreated={handleCreated} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:block lg:h-auto">
      {/* Desktop/tablet: Mes/Semana/Día/Lista + panel lateral, sin cambios. */}
      <div className="hidden space-y-6 lg:block">
        <AgendaHeader
          view={view}
          onViewChange={handleViewChange}
          referenceLabel={referenceLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onCreateClick={() => setIsCreateOpen(true)}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            {view === "month" ? (
              <MonthCalendarGrid
                days={getMonthGridDays(referenceDate)}
                referenceDate={referenceDate}
                eventsByDay={eventsByDay}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
              />
            ) : null}
            {view === "week" ? (
              <WeekCalendarGrid days={getWeekDays(referenceDate)} eventsByDay={eventsByDay} selectedDay={selectedDay} onSelectDay={handleSelectDay} />
            ) : null}
            {view === "day" ? <DayView events={referenceDayEvents} /> : null}
            {view === "list" ? <AgendaListView days={listViewDays} onSelectDay={handleSelectDay} /> : null}
          </div>

          <DayEventsPanel date={panelDate} events={panelDayEvents} />
        </div>
      </div>

      {/* Móvil: experiencia tipo Calendario de iPhone (scroll continuo de meses + vista Día a pantalla completa). */}
      <div className="h-full min-h-0 lg:hidden">
        <MobileAgendaView eventsByDay={eventsByDay} />
      </div>

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        clients={clients}
        projects={projects}
        defaultDate={view === "day" ? toDateInputValue(referenceDate) : toDateInputValue(selectedDay)}
        onCreated={handleCreated}
      />
    </div>
  );
}
