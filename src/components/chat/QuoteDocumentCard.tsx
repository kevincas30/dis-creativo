"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Repeat,
  CheckSquare,
  FileDown,
  MessageCircle,
  Send,
  Copy,
  Check,
  Clock,
  Package,
  Receipt,
  ClipboardList,
} from "lucide-react";
import type { QuoteSnapshot } from "@/lib/quote-presenter";
import { updateQuoteStatus, duplicateQuote } from "@/app/(app)/quotes/actions";
import StatusBadge from "@/components/quotes/StatusBadge";
import Button from "@/components/ui/Button";

function formatMoney(value: number, currency: string | null) {
  if (!currency) return value.toFixed(2);
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

function countryLabelForCurrency(currency: string | null): string | null {
  if (currency === "EUR") return "España";
  if (currency === "MXN") return "México";
  return null;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateHeader(date: Date) {
  const now = new Date();
  const datePart = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
  const timePart = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  return `${isSameDay(date, now) ? "Hoy, " : ""}${datePart} · ${timePart}`;
}

function formatUpdatedFooter(date: Date) {
  const now = new Date();
  const timePart = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  if (isSameDay(date, now)) return `Última actualización · hoy ${timePart}`;
  const datePart = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
  return `Última actualización · ${datePart}, ${timePart}`;
}

function DividerLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex items-center gap-3 text-xs">
      <span className="border-surface-border h-px flex-1 border-t" />
      <span className="shrink-0">{children}</span>
      <span className="border-surface-border h-px flex-1 border-t" />
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  children: React.ReactNode;
}) {
  return (
    <div className="border-surface-border bg-surface-solid/40 rounded-2xl border p-5">
      <h3 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function QuoteDocumentCard({
  quote,
  quoteId,
  onQuoteUpdate,
}: {
  quote: QuoteSnapshot;
  quoteId: string;
  onQuoteUpdate: (quote: QuoteSnapshot) => void;
}) {
  const router = useRouter();
  const [isMarkingSent, startMarkSent] = useTransition();
  const [isDuplicating, startDuplicate] = useTransition();
  const [copied, setCopied] = useState(false);

  const currency = quote.currency;
  const countryLabel = countryLabelForCurrency(currency);
  const createdAt = new Date(quote.createdAt);
  const updatedAt = new Date(quote.updatedAt);

  function handleMarkSent() {
    if (quote.status === "SENT") return;
    onQuoteUpdate({ ...quote, status: "SENT" });
    startMarkSent(async () => {
      await updateQuoteStatus(quoteId, "SENT");
      router.refresh();
    });
  }

  function handleDuplicate() {
    startDuplicate(async () => {
      await duplicateQuote(quoteId);
    });
  }

  async function handleCopyWhatsapp() {
    const lines = [
      `Presupuesto para ${quote.client?.name ?? "cliente"}${quote.client?.company ? ` (${quote.client.company})` : ""}`,
      "",
      ...quote.lineItems.map((item) => `- ${item.description} x${item.quantity}: ${formatMoney(item.lineTotal, currency)}`),
      "",
      `Subtotal: ${formatMoney(quote.subtotal, currency)}`,
      `IVA${quote.taxRatePercent != null ? ` (${quote.taxRatePercent}%)` : ""}: ${formatMoney(quote.taxAmount, currency)}`,
      `Total: ${formatMoney(quote.total, currency)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (permiso denegado, documento sin foco,
      // etc.) — no hay nada más que hacer que dejar el botón como estaba.
    }
  }

  return (
    <div className="w-full max-w-[900px]">
      <div className="mb-6">
        <DividerLabel>{formatDateHeader(createdAt)}</DividerLabel>
      </div>

      <div className="border-surface-border bg-surface-solid animate-fade-in-up mx-auto max-w-[760px] rounded-3xl border p-6 shadow-soft sm:p-8">
        {/* Encabezado */}
        <div className="mb-6 flex flex-col gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">{quote.client?.name ?? "Cliente sin definir"}</h2>
            {quote.client?.company ? <p className="text-muted-foreground text-sm">{quote.client.company}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {countryLabel ? (
              <span className="border-surface-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
                <Globe className="h-3 w-3" strokeWidth={1.75} />
                {countryLabel}
              </span>
            ) : null}
            <span className="border-surface-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium">
              <Repeat className="h-3 w-3" strokeWidth={1.75} />
              Proyecto único
            </span>
            <StatusBadge quoteId={quoteId} status={quote.status} onStatusChange={(status) => onQuoteUpdate({ ...quote, status })} />
          </div>
        </div>

        {/* Resumen financiero */}
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="border-surface-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Subtotal</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(quote.subtotal, currency)}</p>
          </div>
          <div className="border-surface-border rounded-2xl border p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              IVA{quote.taxRatePercent != null ? ` (${quote.taxRatePercent}%)` : ""}
            </p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(quote.taxAmount, currency)}</p>
          </div>
          <div className="bg-accent-soft rounded-2xl p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Total</p>
            <p className="mt-1 text-lg font-semibold">{formatMoney(quote.total, currency)}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Lo que pidió el cliente */}
          <SectionCard title="Lo que pidió el cliente" icon={ClipboardList}>
            {quote.lineItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin líneas todavía</p>
            ) : (
              <ul className="space-y-2">
                {quote.lineItems.map((item) => (
                  <li key={item.id} className="flex items-start gap-2.5 text-sm">
                    <CheckSquare className="text-accent mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
                    <span>
                      {item.description}
                      {item.quantity !== 1 ? ` × ${item.quantity}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          {/* Desglose */}
          <SectionCard title="Desglose" icon={Receipt}>
            {quote.lineItems.length === 0 ? (
              <p className="text-muted-foreground text-sm">Sin líneas todavía</p>
            ) : (
              <div className="divide-surface-border divide-y">
                {quote.lineItems.map((item) => {
                  const savings = item.quantity * item.unitPrice - item.lineTotal;
                  return (
                    <div key={item.id} className="grid grid-cols-[1fr_auto_auto] items-center gap-3 py-2.5 text-sm">
                      <div>
                        <p>{item.description}</p>
                        {item.discountPercent ? (
                          <p className="text-xs text-emerald-400">
                            -{item.discountPercent}% · ahorras {formatMoney(savings, currency)}
                          </p>
                        ) : null}
                      </div>
                      <span className="text-muted-foreground text-right">×{item.quantity}</span>
                      <span className="text-right font-medium">{formatMoney(item.lineTotal, currency)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </SectionCard>

          {/* Siguiente paso */}
          <SectionCard title="Siguiente paso" icon={Package}>
            <div className="flex flex-wrap gap-2">
              <a
                href={`/api/quotes/${quoteId}/pdf`}
                className="glass text-foreground hover:border-accent/30 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97]"
              >
                <FileDown className="h-4 w-4" strokeWidth={1.75} />
                Exportar PDF
              </a>
              <Button variant="secondary" onClick={handleCopyWhatsapp}>
                {copied ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <MessageCircle className="h-4 w-4" strokeWidth={1.75} />}
                {copied ? "Copiado" : "Copiar WhatsApp"}
              </Button>
              <Button
                variant="secondary"
                onClick={handleMarkSent}
                disabled={isMarkingSent || quote.status === "SENT"}
              >
                {quote.status === "SENT" ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
                {quote.status === "SENT" ? "Enviado" : "Marcar enviado"}
              </Button>
              <Button variant="secondary" onClick={handleDuplicate} disabled={isDuplicating}>
                <Copy className="h-4 w-4" strokeWidth={1.75} />
                Duplicar
              </Button>
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="mt-6">
        <DividerLabel>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {formatUpdatedFooter(updatedAt)}
          </span>
        </DividerLabel>
      </div>
    </div>
  );
}
