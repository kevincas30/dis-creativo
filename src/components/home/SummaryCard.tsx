import { QUOTE_STATUS_CONFIG } from "@/lib/quote-status";

export type QuoteSummaryStats = {
  total: number;
  approved: number;
  pending: number;
  sent: number;
  rejected: number;
  monthlyBilling: { amount: number; currency: string }[];
};

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

export default function SummaryCard({ stats }: { stats: QuoteSummaryStats }) {
  const items = [
    { status: "ACCEPTED", value: stats.approved },
    { status: "DRAFT", value: stats.pending },
    { status: "SENT", value: stats.sent },
    { status: "REJECTED", value: stats.rejected },
  ] as const;

  return (
    <div
      className="liquid-glass animate-fade-in-up w-full rounded-2xl p-4"
      style={{ animationDelay: "220ms" }}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Resumen</h3>
        <span className="text-sm font-semibold">
          {stats.total} {stats.total === 1 ? "presupuesto" : "presupuestos"}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5 text-sm">
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${QUOTE_STATUS_CONFIG[item.status].dotClassName}`} />
            <span className="text-muted-foreground truncate">{QUOTE_STATUS_CONFIG[item.status].label}s</span>
            <span className="font-medium">{item.value}</span>
          </div>
        ))}
      </div>

      {stats.monthlyBilling.length > 0 ? (
        <div className="border-surface-border mt-3 flex items-center justify-between border-t pt-3 text-sm">
          <span className="text-muted-foreground">Facturación del mes</span>
          <span className="font-semibold">
            {stats.monthlyBilling.map((entry) => formatMoney(entry.amount, entry.currency)).join(" + ")}
          </span>
        </div>
      ) : null}
    </div>
  );
}
