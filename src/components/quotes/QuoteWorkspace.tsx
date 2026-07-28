"use client";

import { useState } from "react";
import ChatPanel, { type ChatMessage } from "@/components/chat/ChatPanel";
import QuotePreview from "@/components/quotes/QuotePreview";
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

  return (
    <div className="flex h-full">
      <div className="border-surface-border flex w-[56%] flex-col border-r">
        <ChatPanel quoteId={quoteId} initialMessages={initialMessages} isNew={isNew} onQuoteUpdate={setQuote} />
      </div>
      <div className="w-[44%]">
        <QuotePreview
          quote={quote}
          onStatusChange={(status) => setQuote((prev) => (prev ? { ...prev, status } : prev))}
        />
      </div>
    </div>
  );
}
