import ProjectCard from "@/components/dashboard/projects/ProjectCard";
import { PROJECT_STATUS_CONFIG, PROJECT_STATUS_ORDER } from "@/lib/project-status";
import type { ProjectSnapshot } from "@/lib/project-presenter";

export default function ProjectsBoard({ projects }: { projects: ProjectSnapshot[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PROJECT_STATUS_ORDER.map((status) => {
        const config = PROJECT_STATUS_CONFIG[status];
        const columnProjects = projects.filter((project) => project.status === status);

        return (
          <div key={status} className="flex flex-col gap-3">
            <div className="flex items-center gap-2 px-1">
              <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
              <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{config.label}</h3>
              <span className="text-muted-foreground text-xs">{columnProjects.length}</span>
            </div>

            <div className="flex flex-col gap-3">
              {columnProjects.length === 0 ? (
                <div className="border-surface-border text-muted-foreground rounded-2xl border border-dashed p-4 text-center text-xs">
                  Sin proyectos aquí
                </div>
              ) : (
                columnProjects.map((project) => <ProjectCard key={project.id} project={project} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
