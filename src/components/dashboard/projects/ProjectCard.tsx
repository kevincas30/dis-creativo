import Link from "next/link";
import { CalendarDays } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { PROJECT_STATUS_CONFIG } from "@/lib/project-status";
import type { ProjectSnapshot } from "@/lib/project-presenter";

function formatDueDate(value: string | null): string {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "short" });
}

export default function ProjectCard({ project }: { project: ProjectSnapshot }) {
  const config = PROJECT_STATUS_CONFIG[project.status];

  return (
    <Link
      href={`/projects/${project.id}`}
      className="liquid-glass focus-visible:ring-accent/40 group flex cursor-pointer flex-col gap-3 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none"
      style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{project.name}</p>
          <p className="text-muted-foreground truncate text-xs">{project.client}</p>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badgeClassName}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      <div>
        <div className="bg-foreground/10 h-1.5 w-full overflow-hidden rounded-full">
          <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }} />
        </div>
        <p className="text-muted-foreground mt-1 text-[11px]">{project.progress}%</p>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {formatDueDate(project.dueDate)}
        </span>
        <Avatar name={project.owner ?? "?"} className="h-6 w-6 text-[10px]" />
      </div>
    </Link>
  );
}
