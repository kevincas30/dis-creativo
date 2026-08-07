import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, formatMonthLabel, toMonthParam } from "@/lib/agenda-dates";

type View = "month" | "week" | "agenda";

const VIEW_LABELS: Record<View, string> = { month: "Mes", week: "Semana", agenda: "Agenda" };

export default function CalendarToolbar({ monthDate, view }: { monthDate: Date; view: View }) {
  const prevHref = `/agenda?month=${toMonthParam(addMonths(monthDate, -1))}&view=${view}`;
  const nextHref = `/agenda?month=${toMonthParam(addMonths(monthDate, 1))}&view=${view}`;
  const todayHref = `/agenda?view=${view}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <Link
          href={prevHref}
          aria-label="Mes anterior"
          className="border-surface-border hover:bg-foreground/5 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <Link
          href={nextHref}
          aria-label="Mes siguiente"
          className="border-surface-border hover:bg-foreground/5 flex h-8 w-8 items-center justify-center rounded-lg border transition-colors"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
        </Link>
        <h2 className="ml-1 text-lg font-semibold tracking-tight capitalize">{formatMonthLabel(monthDate)}</h2>
        <Link href={todayHref} className="text-muted-foreground hover:text-foreground ml-2 text-xs font-medium transition-colors">
          Hoy
        </Link>
      </div>

      <div className="border-surface-border flex rounded-lg border p-0.5 text-sm">
        {(Object.keys(VIEW_LABELS) as View[]).map((option) => (
          <Link
            key={option}
            href={`/agenda?month=${toMonthParam(monthDate)}&view=${option}`}
            className={`rounded-md px-3 py-1 transition-colors ${
              view === option ? "bg-white/10 text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {VIEW_LABELS[option]}
          </Link>
        ))}
      </div>
    </div>
  );
}
