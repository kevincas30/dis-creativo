"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Lock, Pencil, Trash2, Plus, Check, X } from "lucide-react";
import type { QuoteSnapshot } from "@/lib/quote-presenter";
import { QUOTE_STATUS_CONFIG } from "@/lib/quote-status";
import { createQuoteNote, updateQuoteNote, deleteQuoteNote } from "@/app/presupuestos/quotes/actions";

function formatHumanDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  if (isToday) {
    const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
    return `Hoy ${time}`;
  }
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function TrackingCard({ children }: { children: ReactNode }) {
  return <div className="liquid-glass animate-fade-in-up rounded-2xl p-4">{children}</div>;
}

function CardTitle({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-white mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
      {children}
    </h3>
  );
}

const textAreaClassName =
  "border-surface-border bg-surface-solid focus:border-accent focus:ring-accent/20 w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-colors focus:ring-4";

export default function QuoteTrackingPanel({
  quote,
  onQuoteUpdate,
}: {
  quote: QuoteSnapshot;
  onQuoteUpdate: (quote: QuoteSnapshot) => void;
}) {
  const statusConfig = QUOTE_STATUS_CONFIG[quote.status];

  // Composición de nota nueva — la caja de texto siempre está lista para
  // escribir; al agregar, la nota se guarda arriba de las anteriores y la
  // caja queda libre para la siguiente.
  const [draft, setDraft] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");

  async function handleAddNote() {
    const content = draft.trim();
    if (!content || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const note = await createQuoteNote(quote.id, content);
      onQuoteUpdate({ ...quote, notes: [note, ...quote.notes] });
      setDraft("");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleDraftKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) return;
    event.preventDefault();
    void handleAddNote();
  }

  function startEdit(noteId: string, content: string) {
    setEditingId(noteId);
    setEditDraft(content);
  }

  async function handleSaveEdit(noteId: string) {
    const content = editDraft.trim();
    if (!content) return;
    await updateQuoteNote(noteId, content);
    onQuoteUpdate({
      ...quote,
      notes: quote.notes.map((note) => (note.id === noteId ? { ...note, content } : note)),
    });
    setEditingId(null);
  }

  async function handleDeleteNote(noteId: string) {
    await deleteQuoteNote(noteId);
    onQuoteUpdate({ ...quote, notes: quote.notes.filter((note) => note.id !== noteId) });
  }

  return (
    <div className="flex h-full flex-col gap-5 overflow-y-auto p-6">
      {/* Estado */}
      <TrackingCard>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Estado</CardTitle>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium text-white ${statusConfig.badgeSurfaceClassName}`}
          >
            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusConfig.dotClassName}`} />
            {statusConfig.label}
          </span>
        </div>
      </TrackingCard>

      {/* Seguimiento */}
      <TrackingCard>
        <CardTitle>Seguimiento</CardTitle>
        <div className="space-y-2 text-sm">
          {[
            { label: "Creación", value: quote.createdAt },
            { label: "Última actualización", value: quote.updatedAt },
            { label: "Envío", value: quote.sentAt },
            { label: "Aprobación", value: quote.approvedAt },
            { label: "Pago", value: quote.paidAt },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span className="text-white">{row.label}</span>
              <span className="text-muted-foreground">{formatHumanDate(row.value)}</span>
            </div>
          ))}
        </div>
      </TrackingCard>

      {/* Notas internas */}
      <TrackingCard>
        <h3 className="text-white mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
          Notas internas
        </h3>

        <div className="space-y-2">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleDraftKeyDown}
            placeholder="Escribe una nota — solo la ve el estudio, nunca se incluye en el PDF."
            rows={3}
            className={textAreaClassName}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAddNote}
              disabled={isSubmitting || !draft.trim()}
              className="bg-accent-soft text-foreground hover:bg-accent-soft/80 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
              Agregar nota
            </button>
          </div>
        </div>

        {quote.notes.length > 0 ? (
          <div className="border-surface-border mt-4 space-y-3 border-t pt-3">
            {quote.notes.map((note) => (
              <div key={note.id} className="text-sm">
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <textarea
                      autoFocus
                      value={editDraft}
                      onChange={(event) => setEditDraft(event.target.value)}
                      rows={3}
                      className={textAreaClassName}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs transition-colors"
                      >
                        <X className="h-3 w-3" strokeWidth={1.75} />
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(note.id)}
                        className="text-accent inline-flex items-center gap-1 text-xs font-medium transition-colors hover:opacity-80"
                      >
                        <Check className="h-3 w-3" strokeWidth={1.75} />
                        Guardar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="whitespace-pre-wrap">{note.content}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">{formatHumanDate(note.createdAt)}</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => startEdit(note.id, note.content)}
                          aria-label="Editar nota"
                          title="Editar nota"
                          className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteNote(note.id)}
                          aria-label="Eliminar nota"
                          title="Eliminar nota"
                          className="text-muted-foreground transition-colors hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : null}
      </TrackingCard>
    </div>
  );
}
