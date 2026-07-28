"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import type { QuoteSnapshot } from "@/lib/quote-presenter";
import IconButton from "@/components/ui/IconButton";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type StreamEvent =
  | { type: "text"; text: string }
  | { type: "quote_updated"; quote: QuoteSnapshot }
  | { type: "error"; message: string };

export default function ChatPanel({
  quoteId,
  initialMessages,
  isNew,
  onQuoteUpdate,
}: {
  quoteId: string;
  initialMessages: ChatMessage[];
  isNew: boolean;
  onQuoteUpdate: (quote: QuoteSnapshot) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const kickedOff = useRef(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isNew && !kickedOff.current) {
      kickedOff.current = true;
      void runStream({ quoteId, kickoff: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId, isNew]);

  async function runStream(body: { quoteId: string; message?: string; kickoff?: boolean }) {
    setIsSending(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    const showError = (text: string) => {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: updated[updated.length - 1].content + `\n\n⚠️ ${text}`,
        };
        return updated;
      });
    };

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        showError((await response.text()) || `Error del servidor (${response.status}).`);
        return;
      }

      if (!response.body) throw new Error("Sin respuesta del servidor.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as StreamEvent;

          if (event.type === "text") {
            setMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = {
                role: "assistant",
                content: updated[updated.length - 1].content + event.text,
              };
              return updated;
            });
          } else if (event.type === "quote_updated") {
            onQuoteUpdate(event.quote);
          } else if (event.type === "error") {
            showError(event.message);
          }
        }
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Error de conexión con el asistente.");
    } finally {
      setIsSending(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || isSending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    await runStream({ quoteId, message: text });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-5">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`animate-fade-in-up max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
              message.role === "user"
                ? "ml-auto bg-white text-zinc-900 shadow-soft"
                : "bg-assistant-bubble text-assistant-bubble-foreground shadow-soft"
            }`}
          >
            {message.content ? (
              message.content
            ) : isSending && index === messages.length - 1 ? (
              <span className="inline-flex items-center gap-1 py-0.5">
                <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:0ms]" />
                <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:150ms]" />
                <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:300ms]" />
              </span>
            ) : (
              ""
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
        className="border-surface-border flex items-center gap-2 border-t p-4"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Responde aquí..."
          className="border-surface-border bg-surface-solid/40 focus:border-accent focus:ring-accent/20 flex-1 rounded-xl border px-4 py-2.5 text-sm text-inherit outline-none transition-colors focus:ring-4"
          disabled={isSending}
        />
        <IconButton type="submit" variant="accent" disabled={isSending || !input.trim()}>
          <ArrowUp className="h-4 w-4" strokeWidth={2} />
        </IconButton>
      </form>
    </div>
  );
}
