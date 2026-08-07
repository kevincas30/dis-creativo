import { dayKey, isSameDay, WEEKDAY_LABELS } from "@/lib/agenda-dates";
import QuoteDayCard, { type AgendaQuote } from "./QuoteDayCard";

const MAX_VISIBLE = 6;

export default function WeekCalendarGrid({
  days,
  quotesByDay,
}: {
  days: Date[];
  quotesByDay: Map<string, AgendaQuote[]>;
}) {
  const today = new Date();

  return (
    <div className="liquid-glass overflow-hidden rounded-2xl">
      <div className="grid grid-cols-7">
        {days.map((day, index) => {
          const key = dayKey(day);
          const quotes = quotesByDay.get(key) ?? [];
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className="border-surface-border flex min-h-[320px] flex-col gap-1.5 border-r border-b p-2 last:border-r-0"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-muted-foreground text-xs tracking-wide uppercase">{WEEKDAY_LABELS[index]}</span>
                <span
                  className={`text-xs ${
                    isToday
                      ? "bg-accent text-accent-foreground inline-flex h-5 w-5 items-center justify-center rounded-full font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
              <div className="space-y-1.5">
                {quotes.slice(0, MAX_VISIBLE).map((quote) => (
                  <QuoteDayCard key={quote.id} quote={quote} />
                ))}
                {quotes.length > MAX_VISIBLE ? (
                  <p className="text-muted-foreground px-1 text-[11px]">+{quotes.length - MAX_VISIBLE} más</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
