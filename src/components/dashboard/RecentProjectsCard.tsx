type Project = { id: string; name: string; client: string; progress: number };

// Ejemplo — el módulo de Proyectos todavía no está conectado.
const PROJECTS: Project[] = [
  { id: "1", name: "Rediseño web", client: "OBED", progress: 70 },
  { id: "2", name: "Identidad de marca", client: "Laura Gómez", progress: 40 },
  { id: "3", name: "Sistema de membresías", client: "Barbería Cancún", progress: 90 },
];

export default function RecentProjectsCard() {
  return (
    <div className="liquid-glass animate-fade-in-up rounded-2xl p-4" style={{ animationDelay: "220ms" }}>
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Proyectos recientes</h3>

      <div className="space-y-3">
        {PROJECTS.map((project) => (
          <div key={project.id} className="text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="min-w-0 flex-1 truncate font-medium">{project.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">{project.client}</span>
            </div>
            <div className="bg-foreground/10 mt-1.5 h-1.5 w-full overflow-hidden rounded-full">
              <div className="bg-accent h-full rounded-full" style={{ width: `${project.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
