import Link from "next/link";
import { Plus, Calendar, Users, FolderKanban, ListChecks, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type QuickAccess = { icon: LucideIcon; label: string; description: string; href: string };

// Presupuestos IA es el único módulo real hoy; el resto son accesos a los
// módulos placeholder mientras se desarrollan por separado.
const QUICK_ACCESS: QuickAccess[] = [
  { icon: Plus, label: "Nuevo presupuesto", description: "Abre Presupuestos IA", href: "/presupuestos" },
  { icon: Calendar, label: "Agenda comercial", description: "Reuniones y seguimientos", href: "/agenda" },
  { icon: Users, label: "Clientes", description: "Directorio del estudio", href: "/clientes" },
  { icon: FolderKanban, label: "Proyectos", description: "Seguimiento de entregas", href: "/projects" },
  { icon: ListChecks, label: "Trabajo", description: "Pendientes del equipo", href: "/trabajo" },
  { icon: CreditCard, label: "Pagos", description: "Cobros y facturas", href: "/payments" },
];

export default function QuickAccessGrid() {
  return (
    <div className="animate-fade-in-up space-y-3" style={{ animationDelay: "180ms" }}>
      <h3 className="text-muted-foreground px-1 text-xs font-medium tracking-wide uppercase">Accesos rápidos</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {QUICK_ACCESS.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="liquid-glass group focus-visible:ring-accent/40 flex items-center gap-3 rounded-2xl p-4 text-left transition-transform duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none"
            style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
          >
            <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105">
              <item.icon className="text-foreground h-5 w-5" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="text-muted-foreground truncate text-xs">{item.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
