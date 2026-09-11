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
  const [projects, tasks] = await Promise.all([db.project.findMany({
    where: { workspaceId, archivedAt: null },
    select: { id: true, name: true, kind: true, startDate: true, dueDate: true, periods: { select: { id: true, startDate: true, dueDate: true } } },
  }), db.workItem.findMany({ where: { workspaceId, kind: { in: ["TASK", "DELIVERABLE"] }, archivedAt: null, OR: [{ startDate: { not: null } }, { dueDate: { not: null } }] }, select: { id: true, title: true, startDate: true, dueDate: true, status: true, needsReview: true, project: { select: { id: true, name: true } } } })]);
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
  for (const task of tasks) {
    const relatedProject = task.project ?? null;
    const base = relatedProject ?? { id: "", name: "Tarea interna" };
    const sameDay = task.startDate && task.dueDate && task.startDate.toISOString().slice(0, 10) === task.dueDate.toISOString().slice(0, 10);
    const taskData = { taskId: task.id, taskStatus: task.status, taskNeedsReview: task.needsReview };
    if (task.startDate && !sameDay) items.push({ ...item(`task-start-${task.id}`, `Inicio · ${task.title}`, task.startDate, base, "PROJECT_START"), ...taskData, projectId: relatedProject?.id ?? null, project: relatedProject, agendaKind: "TASK_START", href: `/trabajo?task=${task.id}` });
    if (task.dueDate) items.push({ ...item(`task-due-${task.id}`, `${sameDay ? "Tarea" : "Entrega"} · ${task.title}`, task.dueDate, base, "PROJECT_DUE"), ...taskData, projectId: relatedProject?.id ?? null, project: relatedProject, agendaKind: "TASK_DUE", href: `/trabajo?task=${task.id}` });
    else if (task.startDate) items.push({ ...item(`task-start-${task.id}`, `Tarea · ${task.title}`, task.startDate, base, "PROJECT_START"), ...taskData, projectId: relatedProject?.id ?? null, project: relatedProject, agendaKind: "TASK_START", href: `/trabajo?task=${task.id}` });
  }
  return items;
}
