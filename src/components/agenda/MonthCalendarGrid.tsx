import { dayKey, isSameDay, WEEKDAY_LABELS } from "@/lib/agenda-dates";
import QuoteDayCard, { type AgendaQuote } from "./QuoteDayCard";

const MAX_VISIBLE = 3;

export default function MonthCalendarGrid({
  days,
  monthDate,
  quotesByDay,
}: {
  days: Date[];
  monthDate: Date;
  quotesByDay: Map<string, AgendaQuote[]>;
}) {
  const today = new Date();

  return (
    <div className="liquid-glass overflow-hidden rounded-2xl">
      <div className="border-surface-border text-muted-foreground grid grid-cols-7 border-b text-center text-xs font-medium">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={i} className="py-2 tracking-wide uppercase">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dayKey(day);
          const quotes = quotesByDay.get(key) ?? [];
          const isCurrentMonth = day.getMonth() === monthDate.getMonth();
          const isToday = isSameDay(day, today);
          return (
            <div
              key={key}
              className={`border-surface-border flex min-h-[104px] flex-col gap-1 border-r border-b p-1.5 last:border-r-0 ${
                isCurrentMonth ? "" : "opacity-40"
              }`}
            >
              <span
                className={`text-xs ${
                  isToday
                    ? "bg-accent text-accent-foreground inline-flex h-5 w-5 items-center justify-center rounded-full font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                {day.getDate()}
              </span>
              <div className="space-y-1">
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
