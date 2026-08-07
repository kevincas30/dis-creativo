import ProjectCard from "@/components/dashboard/projects/ProjectCard";
import type { ProjectSnapshot } from "@/lib/project-presenter";

export default function ClientProjectsTab({ projects }: { projects: ProjectSnapshot[] }) {
  if (projects.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">Este cliente todavía no tiene proyectos asociados.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
