"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
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

const MAX_TEXTAREA_HEIGHT = 200;

const markdownComponents: Components = {
  p: (props) => <p className="mb-4 last:mb-0" {...props} />,
  h1: (props) => <h1 className="mt-6 mb-3 text-xl font-bold tracking-tight first:mt-0" {...props} />,
  h2: (props) => <h2 className="mt-6 mb-3 text-lg font-semibold tracking-tight first:mt-0" {...props} />,
  h3: (props) => <h3 className="mt-4 mb-2 text-base font-semibold first:mt-0" {...props} />,
  ul: (props) => <ul className="mb-4 ml-5 list-disc space-y-1.5 last:mb-0" {...props} />,
  ol: (props) => <ol className="mb-4 ml-5 list-decimal space-y-1.5 last:mb-0" {...props} />,
  li: (props) => <li className="pl-1 leading-relaxed" {...props} />,
  strong: (props) => <strong className="text-foreground font-semibold" {...props} />,
  em: (props) => <em className="italic" {...props} />,
  hr: (props) => <hr className="border-surface-border my-6" {...props} />,
  a: (props) => (
    <a className="text-accent underline underline-offset-2" target="_blank" rel="noopener noreferrer" {...props} />
  ),
  pre: (props) => (
    <pre
      className="border-surface-border bg-surface-solid/60 mb-4 overflow-x-auto rounded-xl border p-4 text-[13px] leading-relaxed"
      {...props}
    />
  ),
  code: ({ className, children, ...rest }) => {
    const text = String(children).replace(/\n$/, "");
    const isBlock = /language-/.test(className ?? "") || text.includes("\n");
    if (isBlock) {
      return (
        <code className={`font-mono ${className ?? ""}`} {...rest}>
          {text}
        </code>
      );
    }
    return (
      <code className="bg-foreground/10 rounded px-1.5 py-0.5 font-mono text-[13px]" {...rest}>
        {children}
      </code>
    );
  },
  table: (props) => (
    <div className="border-surface-border mb-4 overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props) => <thead className="bg-foreground/5" {...props} />,
  th: (props) => <th className="border-surface-border border-b px-3 py-2 text-left font-semibold" {...props} />,
  td: (props) => <td className="border-surface-border border-b px-3 py-2" {...props} />,
};

function TypingIndicator() {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1 py-0.5">
      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:0ms]" />
      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:150ms]" />
      <span className="animate-typing-dot h-1.5 w-1.5 rounded-full bg-current [animation-delay:300ms]" />
    </span>
  );
}

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
  const router = useRouter();
  const pathname = usePathname();
  // Si es un presupuesto recién creado, arrancamos mostrando solo el saludo
  // del usuario — el mensaje del asistente se revela tras el indicador de
  // escritura simulado, para que se sienta como una respuesta real y no como
  // un chat precargado. Ambos mensajes ya están guardados en la base de datos.
  const [messages, setMessages] = useState<ChatMessage[]>(isNew ? initialMessages.slice(0, 1) : initialMessages);
  const [isIntroTyping, setIsIntroTyping] = useState(isNew);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isIntroTyping]);

  useEffect(() => {
    if (!isNew) return;

    // Limpia el ?new=1 de la URL para que un refresh no repita la animación.
    router.replace(pathname, { scroll: false });

    // Sin guard por ref: en desarrollo, StrictMode monta este efecto dos veces
    // (monta → limpia → monta) para verificar que la limpieza funcione. Un
    // guard por ref bloquearía la segunda pasada real, dejando el timer
    // cancelado sin reemplazo — por eso dejamos que cada pasada cree y limpie
    // su propio timer de forma natural.
    const delay = 400 + Math.random() * 300;
    const timer = setTimeout(() => {
      setIsIntroTyping(false);
      setMessages(initialMessages);
    }, delay);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function resizeTextarea() {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }

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
            // El sidebar (título del presupuesto) vive en el layout, un Server
            // Component aparte — refresh lo sincroniza sin perder el estado del chat.
            router.refresh();
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
    requestAnimationFrame(resizeTextarea);
    await runStream({ quoteId, message: text });
    textareaRef.current?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;
    // Shift+Enter es la única forma de insertar un salto de línea manual —
    // Enter solo, Cmd+Enter y Ctrl+Enter envían el mensaje.
    if (event.shiftKey) return;

    event.preventDefault();
    void sendMessage();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-6 overflow-y-auto px-6 pt-10 pb-6">
        {messages.map((message, index) => {
          const isLastPending = isSending && index === messages.length - 1;

          if (message.role === "user") {
            return (
              <div
                key={index}
                className="animate-fade-in-up ml-auto max-w-[72%] rounded-3xl border border-white/[0.06] bg-[#2a2a2f] px-4 py-2.5 text-sm whitespace-pre-wrap text-white shadow-soft transition-colors duration-150 hover:bg-[#323238]"
              >
                {message.content}
              </div>
            );
          }

          return (
            <div key={index} className="animate-fade-in-up text-foreground max-w-[72%] text-sm leading-relaxed">
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                  {message.content}
                </ReactMarkdown>
              ) : isLastPending ? (
                <TypingIndicator />
              ) : null}
            </div>
          );
        })}
        {isIntroTyping ? (
          <div className="animate-fade-in-up max-w-[72%] text-sm">
            <TypingIndicator />
            <p className="text-muted-foreground mt-1.5 text-xs">Diseño Creativo está preparando el formulario…</p>
          </div>
        ) : null}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          void sendMessage();
        }}
        className="border-surface-border flex items-end gap-2 border-t p-4"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            resizeTextarea();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Escribe la información de tu cliente aquí..."
          rows={1}
          className="border-surface-border bg-surface-solid/40 focus:border-accent focus:ring-accent/20 max-h-[200px] flex-1 resize-none rounded-xl border px-4 py-2.5 text-sm text-inherit outline-none transition-colors focus:ring-4"
          disabled={isSending}
        />
        <IconButton type="submit" variant="accent" disabled={isSending || !input.trim()}>
          <ArrowUp className="h-4 w-4" strokeWidth={2} />
        </IconButton>
      </form>
    </div>
  );
}
