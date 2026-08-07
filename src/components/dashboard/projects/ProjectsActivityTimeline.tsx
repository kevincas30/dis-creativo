import { FolderPlus, PencilLine } from "lucide-react";
import type { ProjectSnapshot } from "@/lib/project-presenter";

function formatRelative(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} d`;
}

// Se deriva de createdAt/updatedAt de los proyectos reales — no hay un
// modelo de bitácora dedicado todavía, así que "creado" vs "actualizado" se
// infiere comparando ambas marcas de tiempo.
export default function ProjectsActivityTimeline({ projects }: { projects: ProjectSnapshot[] }) {
  const events = projects
    .slice()
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 6)
    .map((project) => {
      const wasCreatedNow = new Date(project.updatedAt).getTime() - new Date(project.createdAt).getTime() < 60000;
      return {
        id: project.id,
        icon: wasCreatedNow ? FolderPlus : PencilLine,
        label: wasCreatedNow ? "Proyecto creado" : "Proyecto actualizado",
        subject: project.name,
        when: formatRelative(project.updatedAt),
      };
    });

  return (
    <div className="liquid-glass animate-fade-in-up rounded-2xl p-4" style={{ animationDelay: "320ms" }}>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Actividad reciente</h3>

      {events.length === 0 ? (
        <p className="text-muted-foreground py-3 text-sm">Sin actividad todavía.</p>
      ) : (
        <div className="divide-surface-border divide-y">
          {events.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="bg-accent-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
                <item.icon className="text-foreground h-3.5 w-3.5" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <p className="truncate">{item.label}</p>
                <p className="text-muted-foreground truncate text-xs">{item.subject}</p>
              </span>
              <span className="text-muted-foreground shrink-0 text-xs">{item.when}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
