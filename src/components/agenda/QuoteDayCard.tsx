import Link from "next/link";
import type { QuoteStatus } from "@/generated/prisma/enums";
import { AGENDA_STATUS_COLORS } from "./agenda-colors";

export type AgendaQuote = {
  id: string;
  clientName: string;
  status: QuoteStatus;
  total: number;
  currency: string | null;
};

function formatMoney(value: number, currency: string | null) {
  if (!currency) return value.toFixed(0);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

export default function QuoteDayCard({ quote }: { quote: AgendaQuote }) {
  const colors = AGENDA_STATUS_COLORS[quote.status];
  return (
    <Link
      href={`/presupuestos/quotes/${quote.id}`}
      className={`block truncate rounded-lg border px-1.5 py-1 text-[11px] leading-tight transition-colors duration-150 hover:border-white/30 ${colors.bg} ${colors.border}`}
    >
      <span className="flex items-center gap-1">
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
        <span className={`truncate font-medium ${colors.text}`}>{quote.clientName}</span>
      </span>
      <span className="text-muted-foreground block truncate">{formatMoney(quote.total, quote.currency)}</span>
    </Link>
  );
}
