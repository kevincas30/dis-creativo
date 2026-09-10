import type { PrismaClient } from "@/generated/prisma/client";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

function allDay(value: Date) {
  const start = new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  return { startAt: start.toISOString(), endAt: new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString() };
}
function item(id: string, title: string, date: Date, project: { id: string; name: string }, agendaKind: "PROJECT_START" | "PROJECT_DUE"): AgendaItemSnapshot {
  return { id, title, type: "REMINDER", ...allDay(date), location: null, notes: null, clientId: null, client: null, projectId: project.id, project, agendaKind, href: `/projects/${project.id}`, allDay: true };
}

/** Date entries are derived on read. They never create duplicate Event rows. */
export async function getProjectAgendaItems(db: PrismaClient, workspaceId: string): Promise<AgendaItemSnapshot[]> {
  const projects = await db.project.findMany({
    where: { workspaceId, archivedAt: null },
    select: { id: true, name: true, kind: true, startDate: true, dueDate: true, periods: { select: { id: true, startDate: true, dueDate: true } } },
  });
  const items: AgendaItemSnapshot[] = [];
  for (const project of projects) {
    const base = { id: project.id, name: project.name };
    const dates = project.kind === "RECURRING" && project.periods.length
      ? project.periods.map((period) => ({ key: period.id, startDate: period.startDate, dueDate: period.dueDate }))
      : [{ key: project.id, startDate: project.startDate, dueDate: project.dueDate }];
    for (const datesForScope of dates) {
      if (datesForScope.startDate) items.push(item(`project-start-${datesForScope.key}`, `Inicio · ${project.name}`, datesForScope.startDate, base, "PROJECT_START"));
      if (datesForScope.dueDate) items.push(item(`project-due-${datesForScope.key}`, `Entrega · ${project.name}`, datesForScope.dueDate, base, "PROJECT_DUE"));
    }
  }
  return items;
}
