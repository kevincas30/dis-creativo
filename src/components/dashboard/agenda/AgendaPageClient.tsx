"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import AgendaHeader from "@/components/dashboard/agenda/AgendaHeader";
import MonthCalendarGrid from "@/components/dashboard/agenda/MonthCalendarGrid";
import WeekCalendarGrid from "@/components/dashboard/agenda/WeekCalendarGrid";
import DayView from "@/components/dashboard/agenda/DayView";
import AgendaListView, { type AgendaListDay } from "@/components/dashboard/agenda/AgendaListView";
import DayEventsPanel from "@/components/dashboard/agenda/DayEventsPanel";
import AgendaEmptyState from "@/components/dashboard/agenda/AgendaEmptyState";
import CreateEventModal from "@/components/dashboard/agenda/CreateEventModal";
import CreateAgendaTaskModal from "@/components/dashboard/agenda/CreateAgendaTaskModal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import AgendaContextMenu, { type AgendaContextTarget } from "@/components/dashboard/agenda/AgendaContextMenu";
import { deleteAgendaEvent, moveAgendaItem } from "@/app/(dashboard)/agenda/actions";
import { transitionWorkTask, deleteWorkTask } from "@/app/(dashboard)/trabajo/actions";
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
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export type AgendaView = "month" | "week" | "day" | "list";

export default function AgendaPageClient({
  initialEvents,
  clients,
  projects,
  members,
  quotes,
}: {
  initialEvents: AgendaItemSnapshot[];
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  members: { id: string; name: string }[];
  quotes: { id: string; clientId: string | null; createdAt: string }[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [view, setView] = useState<AgendaView>(() => typeof window === "undefined" ? "week" : (localStorage.getItem("agenda-view") as AgendaView) || "week");
  const [referenceDate, setReferenceDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState(() => new Date());
  const router = useRouter();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTaskCreateOpen, setIsTaskCreateOpen] = useState(false);
  const [memberFilter, setMemberFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [projectFilter, setProjectFilter] = useState("");
  const [createOptions, setCreateOptions] = useState<{ date?: string; type?: "MEETING" | "FOLLOW_UP" | "REMINDER" }>({});
  const [editingEvent, setEditingEvent] = useState<AgendaItemSnapshot | null>(null);
  const [contextMenu, setContextMenu] = useState<AgendaContextTarget | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AgendaItemSnapshot | null>(null);
  const [isActionPending, startTransition] = useTransition();

  useMobileHeaderAction(
    <button
      type="button"
      onClick={() => setContextMenu({ x: 220, y: 96, date: toDateInputValue(selectedDay), item: null })}
      aria-label="Crear en agenda"
      className="shadow-soft flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform duration-150 active:scale-[0.92]"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
    </button>,
  );

  const filteredEvents = useMemo(() => events.filter((event) => (!memberFilter || event.responsibleId === memberFilter) && (!projectFilter || event.projectId === projectFilter) && (typeFilter === "ALL" || (typeFilter === "TASKS" ? Boolean(event.taskId) : typeFilter === "PROJECTS" ? event.agendaKind === "PROJECT_START" || event.agendaKind === "PROJECT_DUE" : typeFilter === "MEETINGS" ? event.type === "MEETING" : event.type === "FOLLOW_UP"))), [events, memberFilter, typeFilter, projectFilter]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, AgendaItemSnapshot[]>();
    for (const event of filteredEvents) {
      const key = dayKey(new Date(event.startAt));
      const existing = map.get(key);
      if (existing) existing.push(event);
      else map.set(key, [event]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
    }
    return map;
  }, [filteredEvents]);

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

  function handleCreated(created: AgendaItemSnapshot) {
    setEvents((prev) => [...prev, created]);
  }

  function handleSelectDay(day: Date) { setSelectedDay(day); }
  function openItem(item: AgendaItemSnapshot) { if (item.href) { router.push(item.href); return; } if (item.type === "FOLLOW_UP") { if (item.quoteId) router.push(`/presupuestos/quotes/${item.quoteId}`); else if (item.clientId) router.push(`/clientes/${item.clientId}`); else setEditingEvent(item); return; } setEditingEvent(item); }
  function openContext(event: React.MouseEvent | React.KeyboardEvent, item: AgendaItemSnapshot | null, date: Date) { event.preventDefault(); setSelectedDay(date); const element = event.currentTarget as HTMLElement; const bounds = element.getBoundingClientRect(); const mouse = event as React.MouseEvent; setContextMenu({ x: mouse.clientX || bounds.left + 16, y: mouse.clientY || bounds.top + 16, item, date: toDateInputValue(date) }); }
  function createFromContext(type: "TASK" | "MEETING" | "FOLLOW_UP" | "EVENT", date: string) { setContextMenu(null); setCreateOptions({ date, type: type === "EVENT" ? "REMINDER" : type === "TASK" ? undefined : type }); if (type === "TASK") setIsTaskCreateOpen(true); else setIsCreateOpen(true); }
  function editFromContext(item: AgendaItemSnapshot) { setContextMenu(null); if (item.taskId) { router.push(`/trabajo?task=${item.taskId}`); return; } if (item.href) { router.push(item.href); return; } setEditingEvent(item); }
  function changeTaskStatus(item: AgendaItemSnapshot) { if (!item.taskId) return; setContextMenu(null); setActionError(null); const action = item.taskStatus === "COMPLETED" ? "REOPEN" : item.taskNeedsReview ? "SEND_REVIEW" : "COMPLETE"; startTransition(async () => { const result = await transitionWorkTask(item.taskId!, action); if (result.error) setActionError(result.error); else router.refresh(); }); }
  function deleteFromContext(item: AgendaItemSnapshot) { setContextMenu(null); setDeleteTarget(item); }
  function confirmDelete() { if (!deleteTarget) return; const item = deleteTarget; setActionError(null); startTransition(async () => { try { if (item.taskId) { const result = await deleteWorkTask(item.taskId); if (result.error) setActionError(result.error); else { setDeleteTarget(null); router.refresh(); } } else if (!item.agendaKind) { await deleteAgendaEvent(item.id); setEvents((current) => current.filter((event) => event.id !== item.id)); setDeleteTarget(null); router.refresh(); } } catch { setActionError("No se pudo eliminar este elemento."); } }); }

  function handleViewChange(nextView: AgendaView) { localStorage.setItem("agenda-view", nextView);
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

  function moveItem(item: AgendaItemSnapshot, date: Date) { const kind = item.taskId ? item.agendaKind as "TASK_START" | "TASK_DUE" : item.agendaKind === "PROJECT_START" || item.agendaKind === "PROJECT_DUE" ? item.agendaKind : "EVENT"; if ((kind === "PROJECT_START" || kind === "PROJECT_DUE") && !window.confirm("¿Cambiar la fecha original del proyecto o periodo?")) return; const id = item.taskId ?? item.projectId ?? item.id; startTransition(async () => { try { await moveAgendaItem({ kind, id, periodId: item.periodId, date: toDateInputValue(date) }); router.refresh(); } catch { setActionError("No se pudo reprogramar el elemento. Se mantuvo su fecha original."); } }); }

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
        <CreateEventModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} clients={clients} projects={projects} members={members} quotes={quotes} onCreated={handleCreated} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col lg:block lg:h-auto">
      {actionError ? <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-500/5 p-3 text-sm text-red-400">{actionError}</p> : null}
      {/* Desktop/tablet: Mes/Semana/Día/Lista + panel lateral, sin cambios. */}
      <div className="hidden space-y-6 lg:block">
        <AgendaHeader
          view={view}
          onViewChange={handleViewChange}
          referenceLabel={referenceLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          onToday={handleToday}
          onCreateClick={() => setContextMenu({ x: 220, y: 120, date: toDateInputValue(selectedDay), item: null })}
        />

        <details className="text-muted-foreground text-xs"><summary className="cursor-pointer">Leyenda</summary><div className="mt-2 flex flex-wrap gap-3"><span>▣ Inicio de proyecto</span><span>⚑ Entrega de proyecto</span><span>✓ Tarea o entregable</span><span>● Reunión</span><span>↗ Seguimiento</span></div></details>
        <div className="flex flex-wrap gap-2"><select aria-label="Tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="border-surface-border bg-surface-solid rounded-lg border px-3 py-2 text-sm"><option value="ALL">Todo</option><option value="TASKS">Tareas</option><option value="PROJECTS">Proyectos</option><option value="MEETINGS">Reuniones</option><option value="FOLLOW_UP">Seguimientos</option></select><select aria-label="Proyecto" value={projectFilter} onChange={(event) => setProjectFilter(event.target.value)} className="border-surface-border bg-surface-solid rounded-lg border px-3 py-2 text-sm"><option value="">Todos los proyectos</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{members.length > 1 ? <select aria-label="Responsable" value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} className="border-surface-border bg-surface-solid rounded-lg border px-3 py-2 text-sm"><option value="">Todo el equipo</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select> : null}</div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
          <div>
            {view === "month" ? (
              <MonthCalendarGrid
                days={getMonthGridDays(referenceDate)}
                referenceDate={referenceDate}
                eventsByDay={eventsByDay}
                selectedDay={selectedDay}
                onSelectDay={handleSelectDay}
                onContextMenu={openContext}
                onOpenItem={openItem}
                onMoveItem={moveItem}
              />
            ) : null}
            {view === "week" ? (
              <WeekCalendarGrid days={getWeekDays(referenceDate)} eventsByDay={eventsByDay} selectedDay={selectedDay} onSelectDay={handleSelectDay} onContextMenu={openContext} onOpenItem={openItem} onMoveItem={moveItem} />
            ) : null}
            {view === "day" ? <DayView events={referenceDayEvents} /> : null}
            {view === "list" ? <AgendaListView days={listViewDays} onSelectDay={handleSelectDay} /> : null}
          </div>

          <DayEventsPanel date={panelDate} events={panelDayEvents} />
        </div>
      </div>

      {/* Móvil: experiencia tipo Calendario de iPhone (scroll continuo de meses + vista Día a pantalla completa). */}
      <div className="h-full min-h-0 lg:hidden">
        <MobileAgendaView eventsByDay={eventsByDay} onOpenItem={openItem} onMoreItem={(event, item) => openContext(event, item, new Date(item.startAt))} />
      </div>

      <CreateEventModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        clients={clients}
        projects={projects}
        members={members}
        quotes={quotes}
        defaultDate={createOptions.date ?? (view === "day" ? toDateInputValue(referenceDate) : toDateInputValue(selectedDay))}
        defaultType={createOptions.type}
        onCreated={(created) => { handleCreated(created); setCreateOptions({}); }}
      />
      <CreateEventModal isOpen={Boolean(editingEvent)} onClose={() => setEditingEvent(null)} clients={clients} projects={projects} members={members} quotes={quotes} event={editingEvent} onCreated={(updated) => { setEvents((current) => current.map((event) => event.id === updated.id ? updated : event)); setEditingEvent(null); }} />
      <CreateAgendaTaskModal isOpen={isTaskCreateOpen} onClose={() => setIsTaskCreateOpen(false)} onCreated={() => router.refresh()} date={createOptions.date} projects={projects} members={members} />
      <AgendaContextMenu target={contextMenu} onClose={() => setContextMenu(null)} onCreate={createFromContext} onOpen={(item) => { setContextMenu(null); openItem(item); }} onEdit={editFromContext} onTaskStatus={changeTaskStatus} onDelete={deleteFromContext} />
      <ConfirmDialog isOpen={Boolean(deleteTarget)} title={deleteTarget?.taskId ? "Eliminar tarea" : "Eliminar evento"} description="Esta acción eliminará el elemento y no se puede deshacer." confirmLabel="Eliminar" pendingLabel="Eliminando..." icon={Trash2} isPending={isActionPending} onClose={() => setDeleteTarget(null)} onConfirm={confirmDelete} />
    </div>
  );
}
