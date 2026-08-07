// Convierte un Event de Prisma a un objeto plano serializable en JSON, para
// pasar datos del servidor a los componentes cliente de Agenda comercial.

import type { EventType } from "@/generated/prisma/enums";

export type EventInput = {
  id: string;
  title: string;
  type: EventType;
  startAt: Date;
  endAt: Date;
  location: string | null;
  notes: string | null;
  clientId: string | null;
  client: { id: string; name: string } | null;
  projectId: string | null;
  project: { id: string; name: string } | null;
};

export type EventSnapshot = ReturnType<typeof serializeEvent>;

export function serializeEvent(event: EventInput) {
  return {
    id: event.id,
    title: event.title,
    type: event.type,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    location: event.location,
    notes: event.notes,
    clientId: event.clientId,
    client: event.client,
    projectId: event.projectId,
    project: event.project,
  };
}
