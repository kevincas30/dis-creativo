// Convierte un Event de Prisma a un objeto plano serializable en JSON, para
// pasar datos del servidor a los componentes cliente de Agenda comercial.

import type { EventType } from "@/generated/prisma/enums";

export type EventInput = {
  id: string;
  title: string;
  type: EventType;
  startAt: Date;
  endAt: Date;
  allDay?: boolean;
  responsibleId?: string | null;
  responsible?: { id: string; displayName: string } | null;
  location: string | null;
  notes: string | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  projectId: string | null;
  quoteId?: string | null;
  periodId?: string | null;
  project: { id: string; name: string } | null;
};

export type EventSnapshot = ReturnType<typeof serializeEvent>;

export type AgendaItemSnapshot = EventSnapshot & {
  agendaKind?: "EVENT" | "PROJECT_START" | "PROJECT_DUE" | "TASK_START" | "TASK_DUE";
  href?: string | null;
  allDay?: boolean;
  /** WorkItem source for derived task dates. Persisted Events intentionally omit it. */
  taskId?: string | null;
  taskStatus?: "PENDING" | "IN_PROGRESS" | "IN_REVIEW" | "COMPLETED" | null;
  taskNeedsReview?: boolean | null;
  periodId?: string | null;
};

export function serializeEvent(event: EventInput) {
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    allDay: event.allDay ?? false,
    responsibleId: event.responsibleId ?? null,
    responsible: event.responsible ?? null,
    location: event.location,
    notes: event.notes,
    clientId: event.clientId,
    client: event.client,
    projectId: event.projectId,
    project: event.project,
    quoteId: event.quoteId ?? null,
    periodId: event.periodId ?? null,
  };
}
