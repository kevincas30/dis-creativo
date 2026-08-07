import type { ProjectStatus } from "@/generated/prisma/enums";

export const PROJECT_STATUS_ORDER: ProjectStatus[] = ["NOT_STARTED", "IN_PROGRESS", "REVIEW", "DONE"];

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; dot: string; badgeClassName: string }> = {
  NOT_STARTED: { label: "Por iniciar", dot: "bg-zinc-400", badgeClassName: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300" },
  IN_PROGRESS: { label: "En progreso", dot: "bg-blue-400", badgeClassName: "border-blue-400/30 bg-blue-400/10 text-blue-300" },
  REVIEW: { label: "En revisión", dot: "bg-amber-400", badgeClassName: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  DONE: { label: "Finalizado", dot: "bg-emerald-400", badgeClassName: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
};
