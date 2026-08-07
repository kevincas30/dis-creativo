"use client";

import { useEffect, useState } from "react";
import { PanelRight, X } from "lucide-react";
import ChatPanel, { type ChatMessage } from "@/components/chat/ChatPanel";
import QuoteTrackingPanel from "@/components/quotes/QuoteTrackingPanel";
import type { QuoteSnapshot } from "@/lib/quote-presenter";

export default function QuoteWorkspace({
  quoteId,
  initialMessages,
  initialQuote,
  isNew,
}: {
  quoteId: string;
  initialMessages: ChatMessage[];
  initialQuote: QuoteSnapshot;
  isNew: boolean;
}) {
  const [quote, setQuote] = useState<QuoteSnapshot>(initialQuote);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Debajo de xl el panel derecho vive como drawer — Escape lo cierra igual
  // que el fondo oscuro, como cualquier overlay de la app.
  useEffect(() => {
    if (!isDetailsOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsDetailsOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailsOpen]);

  return (
    <div className="relative grid h-full grid-cols-1 xl:grid-cols-[1fr_320px]">
      <div className="border-surface-border flex min-w-0 flex-col overflow-hidden xl:border-r">
        <ChatPanel
          quoteId={quoteId}
          initialMessages={initialMessages}
          isNew={isNew}
          quote={quote}
          onQuoteUpdate={setQuote}
          initialCanExportPdf={initialQuote.lineItems.length > 0 && Boolean(initialQuote.client)}
        />
      </div>

      {/* Botón flotante — solo cuando el panel derecho está oculto (< xl) */}
      <button
        type="button"
        onClick={() => setIsDetailsOpen(true)}
        aria-label="Ver detalles del presupuesto"
        className="liquid-glass focus-visible:ring-accent/40 fixed right-6 bottom-6 z-30 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-foreground shadow-soft transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none xl:hidden"
      >
        <PanelRight className="h-4 w-4" strokeWidth={1.75} />
        Detalles
      </button>

      {/* Fondo del drawer — solo mientras está abierto, debajo de xl */}
      {isDetailsOpen ? (
        <div
          aria-hidden
          onClick={() => setIsDetailsOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 xl:hidden"
        />
      ) : null}

      {/* Panel derecho — columna estática en xl+, drawer deslizante debajo de xl */}
      <div
        className={`border-surface-border bg-black fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col overflow-hidden border-l shadow-2xl transition-transform duration-300 ease-out xl:static xl:z-auto xl:w-full xl:max-w-none xl:translate-x-0 xl:border-l xl:shadow-none ${
          isDetailsOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="border-surface-border flex shrink-0 items-center justify-between border-b px-4 py-3 xl:hidden">
          <span className="text-sm font-medium">Detalles del presupuesto</span>
          <button
            type="button"
            onClick={() => setIsDetailsOpen(false)}
            aria-label="Cerrar detalles"
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="min-h-0 flex-1">
          <QuoteTrackingPanel quote={quote} onQuoteUpdate={setQuote} />
        </div>
      </div>
    </div>
  );
}
