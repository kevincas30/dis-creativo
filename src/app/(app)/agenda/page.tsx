import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import type { QuoteStatus } from "@/generated/prisma/enums";
import { addDays, dayKey, getMonthGridDays, getWeekDays, parseMonthParam } from "@/lib/agenda-dates";
import CalendarToolbar from "@/components/agenda/CalendarToolbar";
import AgendaSummaryCards from "@/components/agenda/AgendaSummaryCards";
import MonthCalendarGrid from "@/components/agenda/MonthCalendarGrid";
import WeekCalendarGrid from "@/components/agenda/WeekCalendarGrid";
import AgendaListView from "@/components/agenda/AgendaListView";
import ActivityTimeline from "@/components/agenda/ActivityTimeline";
import StatusDonutChart from "@/components/agenda/StatusDonutChart";
import UpcomingFollowUps, { type UpcomingFollowUp } from "@/components/agenda/UpcomingFollowUps";
import type { AgendaQuote } from "@/components/agenda/QuoteDayCard";
import { getRecentActivity } from "@/lib/activity";

type View = "month" | "week" | "agenda";

function effectiveDate(quote: { followUpDate: Date | null; createdAt: Date }): Date {
  return quote.followUpDate ?? quote.createdAt;
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; view?: string }>;
}) {
  const { month, view: viewParam } = await searchParams;
  const user = await getCurrentUser();

  const monthDate = parseMonthParam(month);
  const view: View = viewParam === "week" || viewParam === "agenda" ? viewParam : "month";

  const monthGridDays = getMonthGridDays(monthDate);
  const weekDays = getWeekDays(monthDate);
  const visibleDays = view === "week" ? weekDays : monthGridDays;
  const rangeStart = visibleDays[0];
  const rangeEnd = addDays(visibleDays[visibleDays.length - 1], 1);

  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
  const today = new Date();

  const [visibleQuotes, monthQuotesForStats, statusCounts, activityEvents, upcomingFollowUps] = await Promise.all([
    // Quotes que caen en el rango visible del calendario (fecha efectiva).
    prisma.quote.findMany({
      where: {
        userId: user.id,
        OR: [
          { followUpDate: { gte: rangeStart, lt: rangeEnd } },
          { followUpDate: null, createdAt: { gte: rangeStart, lt: rangeEnd } },
        ],
      },
      include: { client: true },
    }),
    // Quotes del mes calendario exacto (para las tarjetas resumen), sin depender de la grilla de 6 semanas.
    prisma.quote.findMany({
      where: {
        userId: user.id,
        OR: [
          { followUpDate: { gte: monthStart, lt: monthEnd } },
          { followUpDate: null, createdAt: { gte: monthStart, lt: monthEnd } },
        ],
      },
      select: { status: true, total: true, currency: true },
    }),
    // Distribución por estado — histórico completo, no solo el mes.
    prisma.quote.groupBy({ by: ["status"], where: { userId: user.id }, _count: { _all: true } }),
    // Actividad reciente: creaciones + cambios de estado, ya intercalados y ordenados.
    getRecentActivity(user.id, 15),
    // Próximos seguimientos: requiere followUpDate fijado explícitamente.
    prisma.quote.findMany({
      where: {
        userId: user.id,
        status: { in: ["DRAFT", "SENT", "ACCEPTED"] },
        followUpDate: { gte: today },
      },
      include: { client: true },
      orderBy: { followUpDate: "asc" },
      take: 6,
    }),
  ]);

  // Agrupar quotes visibles por día (clave = fecha efectiva).
  const quotesByDay = new Map<string, AgendaQuote[]>();
  for (const quote of visibleQuotes) {
    const key = dayKey(effectiveDate(quote));
    const entry: AgendaQuote = {
      id: quote.id,
      clientName: quote.client?.name ?? "Sin cliente",
      status: quote.status,
      total: Number(quote.total),
      currency: quote.currency,
    };
    const existing = quotesByDay.get(key);
    if (existing) existing.push(entry);
    else quotesByDay.set(key, [entry]);
  }

  // Tarjetas resumen del mes.
  const totalCount = monthQuotesForStats.length;
  const pendingCount = monthQuotesForStats.filter((q) => q.status === "DRAFT").length;
  const approvedCount = monthQuotesForStats.filter((q) => q.status === "ACCEPTED").length;
  const billingByCurrency = new Map<string, number>();
  for (const quote of monthQuotesForStats) {
    if ((quote.status === "ACCEPTED" || quote.status === "PAID") && quote.currency) {
      billingByCurrency.set(quote.currency, (billingByCurrency.get(quote.currency) ?? 0) + Number(quote.total));
    }
  }
  const billing = Array.from(billingByCurrency.entries()).map(([currency, amount]) => ({ currency, amount }));

  // Distribución por estado.
  const counts: Partial<Record<QuoteStatus, number>> = {};
  for (const entry of statusCounts) counts[entry.status] = entry._count._all;

  const upcomingItems: UpcomingFollowUp[] = upcomingFollowUps.map((quote) => ({
    id: quote.id,
    clientName: quote.client?.name ?? "Sin cliente",
    status: quote.status,
    date: (quote.followUpDate ?? quote.createdAt).toISOString(),
  }));

  return (
    <div className="grid h-full grid-cols-1 gap-6 overflow-y-auto p-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <AgendaSummaryCards totalCount={totalCount} pendingCount={pendingCount} approvedCount={approvedCount} billing={billing} />

        <CalendarToolbar monthDate={monthDate} view={view} />

        {view === "month" ? <MonthCalendarGrid days={monthGridDays} monthDate={monthDate} quotesByDay={quotesByDay} /> : null}
        {view === "week" ? <WeekCalendarGrid days={weekDays} quotesByDay={quotesByDay} /> : null}
        {view === "agenda" ? <AgendaListView days={monthGridDays} quotesByDay={quotesByDay} /> : null}

        <div className="liquid-glass rounded-2xl p-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Actividad reciente</h3>
          <ActivityTimeline events={activityEvents} />
        </div>
      </div>

      <div className="space-y-6">
        <div className="liquid-glass rounded-2xl p-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Distribución por estado</h3>
          <StatusDonutChart counts={counts} />
        </div>

        <div className="liquid-glass rounded-2xl p-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Ingresos del mes</h3>
          {billing.length > 0 ? (
            <div className="space-y-1">
              {billing.map((entry) => (
                <p key={entry.currency} className="text-xl font-semibold tracking-tight">
                  {new Intl.NumberFormat("es-MX", { style: "currency", currency: entry.currency }).format(entry.amount)}
                </p>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Sin ingresos aprobados este mes.</p>
          )}
        </div>

        <div className="liquid-glass rounded-2xl p-4">
          <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Próximos seguimientos</h3>
          <UpcomingFollowUps items={upcomingItems} />
        </div>
      </div>
    </div>
  );
}
