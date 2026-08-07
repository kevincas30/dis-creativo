// Convierte un Project de Prisma a un objeto plano serializable en JSON,
// usado para pasar datos del servidor a los componentes cliente del tablero.

import type { ProjectStatus } from "@/generated/prisma/enums";

export type ProjectInput = {
  id: string;
  name: string;
  client: string;
  type: string | null;
  description: string | null;
  owner: string | null;
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
    name: project.name,
    client: project.client,
    type: project.type,
    description: project.description,
    owner: project.owner,
    dueDate: project.dueDate ? project.dueDate.toISOString() : null,
    progress: project.progress,
    status: project.status,
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
  };
}
