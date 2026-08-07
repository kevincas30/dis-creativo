import { FileText, Clock, CheckCircle2, DollarSign } from "lucide-react";
import type { LucideIcon } from "lucide-react";

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

export default function AgendaSummaryCards({
  totalCount,
  pendingCount,
  approvedCount,
  billing,
}: {
  totalCount: number;
  pendingCount: number;
  approvedCount: number;
  billing: Array<{ amount: number; currency: string }>;
}) {
  const cards: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Presupuestos del mes", value: String(totalCount), icon: FileText },
    { label: "Pendientes", value: String(pendingCount), icon: Clock },
    { label: "Aprobados", value: String(approvedCount), icon: CheckCircle2 },
    {
      label: "Facturación estimada",
      value: billing.length > 0 ? billing.map((entry) => formatMoney(entry.amount, entry.currency)).join(" + ") : "—",
      icon: DollarSign,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.label}
          className="liquid-glass animate-fade-in-up rounded-2xl p-4"
          style={{ animationDelay: `${index * 40}ms` }}
        >
          <div className="flex items-center gap-2">
            <div className="bg-accent-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
              <card.icon className="text-foreground h-4 w-4" strokeWidth={1.75} />
            </div>
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{card.label}</p>
          </div>
          <p className="mt-2 truncate text-2xl font-semibold tracking-tight">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
