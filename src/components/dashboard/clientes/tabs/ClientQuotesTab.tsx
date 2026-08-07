import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { QuoteStatus } from "@/generated/prisma/enums";

// Etiquetas locales y de solo lectura — no se importa src/lib/quote-status.ts
// a propósito, para no acoplar el módulo Clientes a estilos de Presupuestos IA.
const QUOTE_STATUS_LABELS: Record<QuoteStatus, { label: string; className: string }> = {
  DRAFT: { label: "Pendiente", className: "border-amber-400/30 bg-amber-400/10 text-amber-300" },
  SENT: { label: "Enviado", className: "border-blue-400/30 bg-blue-400/10 text-blue-300" },
  ACCEPTED: { label: "Aprobado", className: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  REJECTED: { label: "Rechazado", className: "border-red-400/30 bg-red-400/10 text-red-300" },
  ARCHIVED: { label: "Archivado", className: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300" },
  PAID: { label: "Pagado", className: "border-violet-400/30 bg-violet-400/10 text-violet-300" },
};

export type ClientQuoteRow = {
  id: string;
  status: QuoteStatus;
  total: number;
  currency: string | null;
  issuedAt: string;
};

function formatMoney(value: number, currency: string | null): string {
  if (!currency) return value.toFixed(2);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

export default function ClientQuotesTab({ quotes }: { quotes: ClientQuoteRow[] }) {
  if (quotes.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">Este cliente todavía no tiene presupuestos.</p>
      </div>
    );
  }

  return (
    <div className="liquid-glass divide-surface-border divide-y overflow-hidden rounded-2xl">
      {quotes.map((quote) => {
        const status = QUOTE_STATUS_LABELS[quote.status];
        return (
          <Link
            key={quote.id}
            href={`/presupuestos/quotes/${quote.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:bg-foreground/5 flex items-center justify-between gap-3 p-4 text-sm transition-colors duration-150"
          >
            <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
              {status.label}
            </span>
            <span className="text-muted-foreground flex-1 truncate">
              {new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(new Date(quote.issuedAt))}
            </span>
            <span className="shrink-0 font-semibold">{formatMoney(quote.total, quote.currency)}</span>
            <ExternalLink className="text-muted-foreground h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          </Link>
        );
      })}
    </div>
  );
}
