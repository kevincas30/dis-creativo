import type { ProjectStatus } from "@/generated/prisma/enums";

/** dueDate procede de un input de fecha, guardado como YYYY-MM-DD UTC. */
export function projectAttention(
  project: { status: ProjectStatus; dueDate: Date | null },
  today: string,
): string | null {
  if (["DONE", "DELIVERED", "CLOSED", "PAUSED", "CANCELLED"].includes(project.status)) return null;
  const dueDay = project.dueDate?.toISOString().slice(0, 10);
  if (dueDay && dueDay < today) return "Entrega vencida";
  if (dueDay === today) return "Entrega hoy";
  if (project.status === "REVIEW") return "Pendiente de revisión";
  return null;
}

export function prioritizeProjects<T extends { status: ProjectStatus; dueDate: Date | null; updatedAt: Date }>(
  projects: T[],
  today: string,
): T[] {
  return projects.filter((project) => !["DONE", "CLOSED", "CANCELLED"].includes(project.status)).sort((a, b) => {
    const attention = Number(Boolean(projectAttention(b, today))) - Number(Boolean(projectAttention(a, today)));
    if (attention) return attention;
    const deadline = (a.dueDate?.getTime() ?? Infinity) - (b.dueDate?.getTime() ?? Infinity);
    return (Number.isNaN(deadline) ? 0 : deadline) || b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}
