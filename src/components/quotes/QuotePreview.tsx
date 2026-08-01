"use client";

import { User, Package, Receipt } from "lucide-react";
import type { QuoteSnapshot } from "@/lib/quote-presenter";
import type { QuoteStatus } from "@/generated/prisma/enums";
import StatusBadge from "@/components/quotes/StatusBadge";

function formatMoney(value: number, currency: string | null) {
  if (!currency) return value.toFixed(2);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

export default function QuotePreview({
  quote,
  onStatusChange,
}: {
  quote: QuoteSnapshot | null;
  onStatusChange: (status: QuoteStatus) => void;
}) {
  if (!quote) {
    return (
      <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-6 text-center text-sm">
        <div className="bg-accent-soft flex h-11 w-11 items-center justify-center rounded-2xl">
          <Receipt className="text-foreground h-5 w-5" strokeWidth={1.5} />
        </div>
        La vista previa del presupuesto aparecerá aquí conforme avance la conversación.
      </div>
    );
  }

  const currency = quote.currency;

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-6">
      <div className="border-surface-border bg-surface-solid/40 animate-fade-in-up rounded-2xl border p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
            <User className="text-foreground h-3.5 w-3.5" strokeWidth={1.75} />
            Cliente
          </h3>
          <StatusBadge quoteId={quote.id} status={quote.status} onStatusChange={onStatusChange} />
        </div>
        {quote.client ? (
          <div className="mt-2">
            <p className="font-medium">{quote.client.name}</p>
            {quote.client.company ? <p className="text-muted-foreground text-sm">{quote.client.company}</p> : null}
          </div>
        ) : (
          <p className="text-muted-foreground mt-2 text-sm">Aún no definido</p>
        )}
      </div>

      <div
        className="border-surface-border bg-surface-solid/40 animate-fade-in-up rounded-2xl border p-4"
        style={{ animationDelay: "60ms" }}
      >
        <h3 className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <Package className="text-foreground h-3.5 w-3.5" strokeWidth={1.75} />
          Servicios y extras
        </h3>
        {quote.lineItems.length === 0 ? (
          <p className="text-muted-foreground mt-2 text-sm">Sin líneas todavía</p>
        ) : (
          <div className="mt-2 space-y-1.5">
            {quote.lineItems.map((item) => (
              <div key={item.id} className="text-sm">
                <div className="flex justify-between">
                  <span>
                    {item.description} × {item.quantity}
                  </span>
                  <span className="text-muted-foreground">{formatMoney(item.lineTotal, currency)}</span>
                </div>
                {item.discountPercent ? (
                  <div className="text-muted-foreground flex justify-between text-xs">
                    <span>Descuento por volumen</span>
                    <span>
                      -{item.discountPercent}% (-{formatMoney(item.quantity * item.unitPrice - item.lineTotal, currency)})
                    </span>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        className="glass animate-fade-in-up mt-auto space-y-1.5 rounded-2xl p-4 text-sm shadow-soft"
        style={{ animationDelay: "120ms" }}
      >
        <div className="text-muted-foreground flex justify-between">
          <span>Subtotal</span>
          <span>{formatMoney(quote.subtotal, currency)}</span>
        </div>
        {quote.discountType ? (
          <div className="text-muted-foreground flex justify-between">
            <span>Descuento{quote.discountReason ? ` (${quote.discountReason})` : ""}</span>
            <span>
              -
              {quote.discountType === "FIXED"
                ? formatMoney(quote.discountValue ?? 0, currency)
                : `${quote.discountValue}%`}
            </span>
          </div>
        ) : null}
        <div className="text-muted-foreground flex justify-between">
          <span>IVA{quote.taxRatePercent != null ? ` (${quote.taxRatePercent}%)` : ""}</span>
          <span>{formatMoney(quote.taxAmount, currency)}</span>
        </div>
        <div className="border-surface-border flex justify-between border-t pt-2 text-base font-semibold">
          <span>Total</span>
          <span className="font-bold text-white">{formatMoney(quote.total, currency)}</span>
        </div>
      </div>
    </div>
  );
}
