"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft } from "lucide-react";
import {
  addDays,
  dayKey,
  formatHourLabel,
  formatMonthNameLabel,
  formatWeekdayLabel,
  isSameDay,
} from "@/lib/dashboard-agenda-dates";
import EventTimelineCard from "@/components/dashboard/agenda/mobile/EventTimelineCard";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

const HOUR_HEIGHT = 64;
const TOTAL_HEIGHT = HOUR_HEIGHT * 24;
const SWIPE_DISTANCE_THRESHOLD = 60;
const SWIPE_DIRECTION_RATIO = 1.5;

function minutesOf(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToPx(minutes: number): number {
  return (minutes / (24 * 60)) * TOTAL_HEIGHT;
}

export default function MobileDayView({
  date,
  eventsByDay,
  onClose,
  onChangeDay,
}: {
  date: Date;
  eventsByDay: Map<string, AgendaItemSnapshot[]>;
  onClose: () => void;
  onChangeDay: (date: Date) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);

  const dayEvents = eventsByDay.get(dayKey(date)) ?? [];
  const today = new Date();
  const isToday = isSameDay(date, today);

  function goToDay(nextDate: Date, direction: "left" | "right") {
    setSlideDirection(direction);
    onChangeDay(nextDate);
  }

  function handlePrevDay() {
    goToDay(addDays(date, -1), "right");
  }

  function handleNextDay() {
    goToDay(addDays(date, 1), "left");
  }

  function handleToday() {
    if (isSameDay(date, today)) return;
    goToDay(today, today > date ? "left" : "right");
  }

  function handleTouchStart(event: React.TouchEvent) {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }

  function handleTouchEnd(event: React.TouchEvent) {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    if (Math.abs(dx) < SWIPE_DISTANCE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * SWIPE_DIRECTION_RATIO) return;
    if (dx < 0) handleNextDay();
    else handlePrevDay();
  }

  // Al abrir o cambiar de día, salta a la hora relevante: el primer evento,
  // la hora actual si es hoy, o 8am por defecto — sin animar el scroll para
  // que no se sienta lento al navegar seguido.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    let targetMinutes: number;
    if (dayEvents.length > 0) {
      targetMinutes = minutesOf(new Date(dayEvents[0].startAt));
    } else if (isToday) {
      targetMinutes = minutesOf(new Date());
    } else {
      targetMinutes = 8 * 60;
    }
    container.scrollTop = Math.max(minutesToPx(targetMinutes) - 120, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayKey(date)]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="liquid-glass border-surface-border shrink-0 border-b px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-accent focus-visible:ring-accent/40 -ml-2 flex items-center gap-0.5 rounded-lg px-2 py-1 text-sm font-medium transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:outline-none"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2} />
            {date.getFullYear()}
          </button>
          <button
            type="button"
            onClick={handleToday}
            className="text-accent focus-visible:ring-accent/40 rounded-lg px-2 py-1 text-sm font-medium transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:outline-none"
          >
            Hoy
          </button>
        </div>

        <div className="mt-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{formatWeekdayLabel(date)}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {date.getDate()} <span className="text-muted-foreground text-base font-normal">de {formatMonthNameLabel(date)}</span>
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto overscroll-contain"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          key={dayKey(date)}
          className={`relative ${slideDirection === "left" ? "animate-agenda-slide-right" : slideDirection === "right" ? "animate-agenda-slide-left" : ""}`}
          style={{ height: TOTAL_HEIGHT }}
        >
          {Array.from({ length: 24 }, (_, hour) => (
            <div key={hour} className="border-surface-border absolute inset-x-0 border-t" style={{ top: hour * HOUR_HEIGHT }}>
              <span className="text-muted-foreground absolute top-[-7px] left-2 bg-black px-1 text-[10px]">{formatHourLabel(hour)}</span>
            </div>
          ))}

          {isToday ? (
            <div className="absolute inset-x-0 z-10 flex items-center gap-1.5" style={{ top: minutesToPx(minutesOf(today)) }}>
              <span className="ml-10 h-2 w-2 shrink-0 rounded-full bg-red-500" />
              <div className="h-px flex-1 bg-red-500" />
            </div>
          ) : null}

          <div className="absolute inset-y-0 right-2 left-14">
            {dayEvents.map((event) => {
              const top = minutesToPx(minutesOf(new Date(event.startAt)));
              const height = Math.max(minutesToPx(minutesOf(new Date(event.endAt))) - top, 28);
              return <EventTimelineCard key={event.id} event={event} top={top} height={height} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
