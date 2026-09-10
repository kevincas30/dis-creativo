// Convierte un Project de Prisma a un objeto plano serializable en JSON,
// usado para pasar datos del servidor a los componentes cliente del tablero.

import type { ProjectStatus } from "@/generated/prisma/enums";

export type ProjectInput = {
  kind?: "ONE_OFF" | "RECURRING";
  relationshipStatus?: "ACTIVE" | "PAUSED" | "CLOSED" | "CANCELLED";
  clientId?: string | null;
  quoteId?: string | null;
  currentPeriod?: { id: string; label: string; status: ProjectStatus; dueDate: Date | null } | null;
  id: string;
  name: string;
  client: string;
  type: string | null;
  description: string | null;
  owner: string | null;
  responsibleId?: string | null;
  startDate?: Date | null;
  depositExpected?: { toFixed: (digits: number) => string } | null;
  archivedAt?: Date | null;
  dueDate: Date | null;
  progress: number;
  status: ProjectStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectSnapshot = ReturnType<typeof serializeProject>;

export function serializeProject(project: ProjectInput) {
  return {
    id: project.id,
    kind: project.kind ?? "ONE_OFF",
    relationshipStatus: project.relationshipStatus ?? "ACTIVE",
    clientId: project.clientId ?? null,
    quoteId: project.quoteId ?? null,
    currentPeriod: project.currentPeriod
      ? { ...project.currentPeriod, dueDate: project.currentPeriod.dueDate?.toISOString() ?? null }
      : null,
    name: project.name,
    client: project.client,
    type: project.type,
    description: project.description,
    owner: project.owner,
    responsibleId: project.responsibleId ?? null,
    startDate: project.startDate ? project.startDate.toISOString() : null,
    depositExpected: project.depositExpected?.toFixed(2) ?? null,
    archivedAt: project.archivedAt ? project.archivedAt.toISOString() : null,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    progress: project.progress,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
