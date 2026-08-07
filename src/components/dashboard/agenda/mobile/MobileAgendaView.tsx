"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { addMonths, dayKey, formatMonthLabel, getMonthGridDays, isSameDay, WEEKDAY_LABELS } from "@/lib/dashboard-agenda-dates";
import MobileMonthGrid from "@/components/dashboard/agenda/mobile/MobileMonthGrid";
import MobileDayView from "@/components/dashboard/agenda/mobile/MobileDayView";
import type { EventSnapshot } from "@/lib/event-presenter";

const MONTHS_BEFORE = 2;
const MONTHS_AFTER = 2;

function offsetWithin(container: HTMLElement, target: HTMLElement): number {
  return target.getBoundingClientRect().top - container.getBoundingClientRect().top + container.scrollTop;
}

// Experiencia móvil tipo Calendario de iPhone: scroll vertical continuo de
// varios meses (sin límite de card ni margen), con el encabezado de días fijo
// arriba y una etiqueta de mes que se sincroniza con lo que está visible.
// Entra siempre en el mes actual, con MONTHS_BEFORE/MONTHS_AFTER meses de
// margen a cada lado. Estado de navegación totalmente independiente del desktop.
export default function MobileAgendaView({ eventsByDay }: { eventsByDay: Map<string, EventSnapshot[]> }) {
  const todayMonthStart = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }, []);

  const months = useMemo(
    () => Array.from({ length: MONTHS_BEFORE + MONTHS_AFTER + 1 }, (_, i) => addMonths(todayMonthStart, i - MONTHS_BEFORE)),
    [todayMonthStart],
  );

  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);
  const [visibleMonthLabel, setVisibleMonthLabel] = useState(() => formatMonthLabel(todayMonthStart));
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollToCurrentMonth(behavior: "instant" | "smooth") {
    const container = scrollRef.current;
    const target = container?.querySelector<HTMLElement>('[data-current-month="true"]');
    if (!container || !target) return;
    container.scrollTo({ top: offsetWithin(container, target), behavior });
  }

  // Al montar, saltar directo al mes actual sin animar (sin importar cuántos
  // meses de margen haya antes en el scroll).
  useEffect(() => {
    scrollToCurrentMonth("instant");
  }, []);

  // Sincroniza la etiqueta de mes flotante con la sección más visible,
  // igual que el encabezado de mes de Calendario de iPhone al hacer scroll.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const sections = Array.from(container.querySelectorAll<HTMLElement>("[data-month-label]"));
    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const label = mostVisible?.target instanceof HTMLElement ? mostVisible.target.dataset.monthLabel : undefined;
        if (label) setVisibleMonthLabel(label);
      },
      { root: container, threshold: [0.25, 0.5, 0.75] },
    );
    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [months]);

  return (
    <div className="flex h-full flex-col">
      <div className="animate-fade-in-up flex shrink-0 items-center justify-between gap-3 px-1 pb-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda comercial</h1>
          <p className="text-muted-foreground mt-1 text-sm">{visibleMonthLabel}</p>
        </div>
        <button
          type="button"
          onClick={() => scrollToCurrentMonth("smooth")}
          className="liquid-glass text-muted-foreground hover:text-foreground shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-150"
        >
          Hoy
        </button>
      </div>

      <div className="border-surface-border grid shrink-0 grid-cols-7 border-b px-1 pb-2">
        {WEEKDAY_LABELS.map((label, index) => (
          <div key={`${label}-${index}`} className="text-muted-foreground text-center text-xs font-medium tracking-wide uppercase">
            {label}
          </div>
        ))}
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-1 pt-4">
        {months.map((month) => {
          const key = dayKey(month);
          const isCurrentMonth = isSameDay(month, todayMonthStart);

          return (
            <div key={key} data-month-label={formatMonthLabel(month)} data-current-month={isCurrentMonth || undefined}>
              <p className="text-muted-foreground mb-2 px-1 text-xs font-semibold tracking-wide uppercase">{formatMonthLabel(month)}</p>
              <MobileMonthGrid days={getMonthGridDays(month)} referenceDate={month} eventsByDay={eventsByDay} onSelectDay={setDayViewDate} />
            </div>
          );
        })}
      </div>

      {dayViewDate ? (
        <MobileDayView date={dayViewDate} eventsByDay={eventsByDay} onClose={() => setDayViewDate(null)} onChangeDay={setDayViewDate} />
      ) : null}
    </div>
  );
}
