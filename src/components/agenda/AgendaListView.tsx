import { dayKey, formatDayLabel } from "@/lib/agenda-dates";
import QuoteDayCard, { type AgendaQuote } from "./QuoteDayCard";

export default function AgendaListView({
  days,
  quotesByDay,
}: {
  days: Date[];
  quotesByDay: Map<string, AgendaQuote[]>;
}) {
  const daysWithQuotes = days.filter((day) => (quotesByDay.get(dayKey(day)) ?? []).length > 0);

  if (daysWithQuotes.length === 0) {
    return (
      <div className="liquid-glass text-muted-foreground rounded-2xl p-8 text-center text-sm">
        No hay presupuestos en este rango.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {daysWithQuotes.map((day) => {
        const quotes = quotesByDay.get(dayKey(day)) ?? [];
        return (
          <div key={dayKey(day)} className="liquid-glass rounded-2xl p-4">
            <h3 className="mb-3 text-sm font-semibold capitalize">{formatDayLabel(day)}</h3>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {quotes.map((quote) => (
                <QuoteDayCard key={quote.id} quote={quote} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
