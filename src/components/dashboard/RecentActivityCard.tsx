import { UserPlus, FolderKanban, CalendarCheck, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type ActivityItem = { id: string; icon: LucideIcon; label: string; subject: string; when: string };

// Actividad de ejemplo del estudio en general (clientes, proyectos, agenda,
// pagos) — todavía no hay un feed real cruzando esos módulos.
const ACTIVITY: ActivityItem[] = [
  { id: "1", icon: UserPlus, label: "Nuevo cliente", subject: "Barbería Cancún", when: "hace 2 h" },
  { id: "2", icon: FolderKanban, label: "Proyecto actualizado", subject: "Rediseño web — OBED", when: "hace 5 h" },
  { id: "3", icon: CalendarCheck, label: "Reunión agendada", subject: "Laura Gómez", when: "ayer" },
  { id: "4", icon: CreditCard, label: "Pago recibido", subject: "Laura Arvenz", when: "hace 2 d" },
];

export default function RecentActivityCard() {
  return (
    <div className="liquid-glass animate-fade-in-up flex h-full w-full flex-col rounded-2xl p-4" style={{ animationDelay: "260ms" }}>
      <h3 className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">Actividad reciente</h3>

      <div className="divide-surface-border divide-y">
        {ACTIVITY.map((item) => (
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
    </div>
  );
}
