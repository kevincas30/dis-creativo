import { Users, FolderKanban, CreditCard, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Stat = { icon: LucideIcon; label: string; value: string };

// Métricas de ejemplo — el estudio todavía no tiene módulos de clientes,
// proyectos, pagos ni agenda conectados a datos reales.
const STATS: Stat[] = [
  { icon: Users, label: "Clientes activos", value: "18" },
  { icon: FolderKanban, label: "Proyectos en curso", value: "5" },
  { icon: CreditCard, label: "Pagos pendientes", value: "$3,450" },
  { icon: Calendar, label: "Reuniones esta semana", value: "3" },
];

export default function StatsGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {STATS.map((stat, index) => (
        <div
          key={stat.label}
          className="liquid-glass animate-fade-in-up flex flex-col gap-3 rounded-2xl p-4"
          style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)", animationDelay: `${100 + index * 40}ms` } as React.CSSProperties}
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
