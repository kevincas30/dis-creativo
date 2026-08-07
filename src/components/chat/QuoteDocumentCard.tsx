"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Globe,
  Repeat,
  Clock,
  Receipt,
  CheckSquare,
  ClipboardList,
  Package,
  FileDown,
  MessageCircle,
  Send,
  Copy,
  Check,
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

// Igual que el encabezado de SectionCard, pero sin la tarjeta (borde/fondo)
// que lo envuelve — para secciones que deben verse "sueltas" en el documento.
function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}) {
  return (
    <h3 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {title}
    </h3>
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

  // Solo para marcar visualmente cuál de las 3 cifras está mirando el
  // usuario — no representa ningún dato, no se persiste en ningún lado.
  // "Total" sale resaltado por defecto; al marcar otra cifra, esa pasa a
  // ser la resaltada.
  const [selectedCard, setSelectedCard] = useState<"subtotal" | "tax" | "total">("total");
  function toggleCard(key: "subtotal" | "tax" | "total") {
    setSelectedCard(key);
  }

  // "Última actualización" no solo refleja quote.updatedAt (que únicamente
  // cambia cuando el backend recalcula el presupuesto tras un mensaje nuevo)
  // — también se adelanta al momento con cualquier interacción dentro de
  // esta vista (cambiar estado, exportar PDF, copiar WhatsApp), sin
  // recargar la página. Al llegar un mensaje nuevo, React desmonta esta
  // instancia (deja de ser el último turno) y monta una nueva con el
  // quote.updatedAt real del turno siguiente — así el ajuste local nunca
  // sobrevive a un mensaje real.
  const [lastActivityAt, setLastActivityAt] = useState(() => new Date(quote.updatedAt));

  function handleStatusChange(status: QuoteSnapshot["status"]) {
    onQuoteUpdate({ ...quote, status });
    setLastActivityAt(new Date());
  }

  function handleMarkSent() {
    if (quote.status === "SENT") return;
    handleStatusChange("SENT");
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
      setLastActivityAt(new Date());
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Portapapeles no disponible (permiso denegado, documento sin foco,
      // etc.) — no hay nada más que hacer que dejar el botón como estaba.
    }
  }

  return (
    <div className="w-full min-w-0 max-w-[900px] overflow-hidden">
      <div className="animate-fade-in-up mx-auto max-w-[760px] space-y-6">
        {/* Encabezado */}
        <div className="flex flex-col gap-3">
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
            <StatusBadge quoteId={quoteId} status={quote.status} onStatusChange={handleStatusChange} />
          </div>
        </div>

        {/* Resumen financiero — no son botones, solo se marcan al hacer clic */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(
            [
              { key: "subtotal", label: "Subtotal", value: quote.subtotal },
              {
                key: "tax",
                label: `IVA${quote.taxRatePercent != null ? ` (${quote.taxRatePercent}%)` : ""}`,
                value: quote.taxAmount,
              },
              { key: "total", label: "Total", value: quote.total },
            ] as const
          ).map((card) => {
            const isSelected = selectedCard === card.key;
            return (
              <div
                key={card.key}
                onClick={() => toggleCard(card.key)}
                className={`cursor-pointer rounded-2xl border p-4 transition-colors duration-200 select-none ${
                  isSelected ? "border-emerald-500/30 bg-emerald-500/10" : "border-surface-border hover:border-emerald-500/20"
                }`}
              >
                <p
                  className={`text-xs font-medium tracking-wide uppercase ${isSelected ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {card.label}
                </p>
                <p className={`mt-1 text-lg font-semibold ${isSelected ? "text-emerald-400" : ""}`}>
                  {formatMoney(card.value, currency)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Lo que pidió el cliente */}
        <div>
          <SectionHeading title="Lo que pidió el cliente" icon={ClipboardList} />
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
        </div>

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
        <div>
          <SectionHeading title="Siguiente paso" icon={Package} />
          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/quotes/${quoteId}/pdf`}
              onClick={() => setLastActivityAt(new Date())}
              className="glass text-foreground hover:border-blue-600 hover:bg-blue-600 hover:text-white inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-150 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97]"
            >
              <FileDown className="h-4 w-4" strokeWidth={1.75} />
              Exportar PDF
            </a>
            <Button
              variant="secondary"
              className="hover:border-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={handleCopyWhatsapp}
            >
              {copied ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <MessageCircle className="h-4 w-4" strokeWidth={1.75} />}
              {copied ? "Copiado" : "Copiar WhatsApp"}
            </Button>
            <Button
              variant="secondary"
              className="hover:border-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={handleMarkSent}
              disabled={isMarkingSent || quote.status === "SENT"}
            >
              {quote.status === "SENT" ? <Check className="h-4 w-4" strokeWidth={1.75} /> : <Send className="h-4 w-4" strokeWidth={1.75} />}
              {quote.status === "SENT" ? "Enviado" : "Marcar enviado"}
            </Button>
            <Button
              variant="secondary"
              className="hover:border-blue-600 hover:bg-blue-600 hover:text-white"
              onClick={handleDuplicate}
              disabled={isDuplicating}
            >
              <Copy className="h-4 w-4" strokeWidth={1.75} />
              Duplicar
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <DividerLabel>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3 w-3" strokeWidth={1.75} />
            {formatUpdatedFooter(lastActivityAt)}
          </span>
        </DividerLabel>
      </div>
    </div>
  );
}
