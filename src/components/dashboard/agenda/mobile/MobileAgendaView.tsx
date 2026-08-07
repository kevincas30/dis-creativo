"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { addMonths, formatMonthLabel, getMonthGridDays } from "@/lib/dashboard-agenda-dates";
import MobileMonthGrid from "@/components/dashboard/agenda/mobile/MobileMonthGrid";
import MobileDayView from "@/components/dashboard/agenda/mobile/MobileDayView";
import type { EventSnapshot } from "@/lib/event-presenter";

// Experiencia móvil tipo Calendario de iPhone: mes con puntos (sin texto) +
// vista Día a pantalla completa al tocar. Estado de navegación totalmente
// independiente del desktop (que sigue usando Mes/Semana/Día/Lista + panel
// lateral) — solo comparten los eventos ya cargados.
export default function MobileAgendaView({
  eventsByDay,
  onCreateClick,
}: {
  eventsByDay: Map<string, EventSnapshot[]>;
  onCreateClick: () => void;
}) {
  const [referenceMonth, setReferenceMonth] = useState(() => new Date());
  const [dayViewDate, setDayViewDate] = useState<Date | null>(null);

  return (
    <div className="space-y-4">
      <div className="animate-fade-in-up flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda comercial</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organiza reuniones, entregas y seguimientos del estudio</p>
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          aria-label="Nuevo evento"
          className="shadow-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white transition-all duration-200 ease-out active:scale-[0.95] active:bg-blue-700"
        >
          <Plus className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="liquid-glass flex items-center gap-0.5 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setReferenceMonth((prev) => addMonths(prev, -1))}
            aria-label="Mes anterior"
            className="text-muted-foreground hover:bg-foreground/5 flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={() => setReferenceMonth(new Date())}
            className="text-muted-foreground hover:bg-foreground/5 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setReferenceMonth((prev) => addMonths(prev, 1))}
            aria-label="Mes siguiente"
            className="text-muted-foreground hover:bg-foreground/5 flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150"
          >
            <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <span className="text-sm font-medium">{formatMonthLabel(referenceMonth)}</span>
      </div>

      <MobileMonthGrid
        days={getMonthGridDays(referenceMonth)}
        referenceDate={referenceMonth}
        eventsByDay={eventsByDay}
        onSelectDay={setDayViewDate}
      />

      {dayViewDate ? (
        <MobileDayView date={dayViewDate} eventsByDay={eventsByDay} onClose={() => setDayViewDate(null)} onChangeDay={setDayViewDate} />
      ) : null}
    </div>
  );
}
