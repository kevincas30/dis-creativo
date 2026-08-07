import { FolderKanban, Eye, CheckCircle2, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ProjectsStats = {
  active: number;
  inReview: number;
  finishedThisMonth: number;
  averageProgress: number | null;
};

export default function ProjectsStatsGrid({ stats }: { stats: ProjectsStats }) {
  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: FolderKanban, label: "Proyectos activos", value: String(stats.active) },
    { icon: Eye, label: "En revisión", value: String(stats.inReview) },
    { icon: CheckCircle2, label: "Finalizados este mes", value: String(stats.finishedThisMonth) },
    { icon: TrendingUp, label: "Progreso promedio", value: stats.averageProgress === null ? "—" : `${stats.averageProgress}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((stat, index) => (
        <div
          key={stat.label}
          className="liquid-glass animate-fade-in-up flex flex-col gap-3 rounded-2xl p-4"
          style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)", animationDelay: `${80 + index * 40}ms` } as React.CSSProperties}
        >
          <div className="bg-accent-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <stat.icon className="text-foreground h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold tracking-tight">{stat.value}</p>
            <p className="text-muted-foreground truncate text-xs">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
