type PendingPayment = { id: string; client: string; amount: string; dueLabel: string };

// Ejemplo — el módulo de Pagos todavía no está conectado.
const PENDING_PAYMENTS: PendingPayment[] = [
  { id: "1", client: "OBED", amount: "$1,200", dueLabel: "Vence en 3 días" },
  { id: "2", client: "Laura Gómez", amount: "$850", dueLabel: "Vence en 5 días" },
  { id: "3", client: "Barbería Cancún", amount: "$1,400", dueLabel: "Vencido hace 1 día" },
];

export default function PendingPaymentsCard() {
  return (
    <div className="liquid-glass animate-fade-in-up rounded-2xl p-4" style={{ animationDelay: "300ms" }}>
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Pagos pendientes</h3>

      <div className="divide-surface-border divide-y">
        {PENDING_PAYMENTS.map((payment) => (
          <div key={payment.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 flex-1">
              <p className="truncate font-medium">{payment.client}</p>
              <p className="text-muted-foreground truncate text-xs">{payment.dueLabel}</p>
            </span>
            <span className="shrink-0 font-semibold">{payment.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
