import { FolderKanban, FileText, CalendarCheck, CreditCard } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ClientSummary = {
  activeProjects: number;
  sentQuotes: number;
  registeredMeetings: number;
  pendingPayments: number | null;
};

export default function ClientSummaryTiles({ summary }: { summary: ClientSummary }) {
  const tiles: { icon: LucideIcon; label: string; value: string }[] = [
    { icon: FolderKanban, label: "Proyectos activos", value: String(summary.activeProjects) },
    { icon: FileText, label: "Presupuestos enviados", value: String(summary.sentQuotes) },
    { icon: CalendarCheck, label: "Reuniones registradas", value: String(summary.registeredMeetings) },
    { icon: CreditCard, label: "Pagos pendientes", value: summary.pendingPayments === null ? "—" : String(summary.pendingPayments) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {tiles.map((tile, index) => (
        <div
          key={tile.label}
          className="liquid-glass animate-fade-in-up flex flex-col gap-3 rounded-2xl p-4"
          style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)", animationDelay: `${80 + index * 40}ms` } as React.CSSProperties}
        >
          <div className="bg-accent-soft flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
            <tile.icon className="text-foreground h-4 w-4" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-xl font-semibold tracking-tight">{tile.value}</p>
            <p className="text-muted-foreground truncate text-xs">{tile.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
