type MonthlyBillingCardProps = {
  currentAmount: number;
  currency: string;
  changePercent: number | null;
  monthLabel: string;
};

export default function MonthlyBillingCard({ currentAmount, currency, changePercent, monthLabel }: MonthlyBillingCardProps) {
  const formattedAmount = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(currentAmount);

  const showVariation = changePercent !== null;
  const isPositive = (changePercent ?? 0) >= 0;

  return (
    <div
      className="border-surface-border bg-surface animate-fade-in-up w-full rounded-2xl border p-6"
      style={{ animationDelay: "220ms" }}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Facturación estimada del mes</p>
        <span className="border-surface-border text-muted-foreground shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium">
          {monthLabel}
        </span>
      </div>

      <p className="mt-4 text-center text-4xl font-semibold tracking-tight">{formattedAmount}</p>

      <p className={`mt-2 text-center text-xs ${showVariation ? (isPositive ? "text-emerald-400" : "text-red-400") : "text-muted-foreground"}`}>
        {showVariation
          ? `${isPositive ? "+" : ""}${changePercent!.toFixed(0)}% respecto al mes pasado`
          : "Sin datos suficientes"}
      </p>
    </div>
  );
}
