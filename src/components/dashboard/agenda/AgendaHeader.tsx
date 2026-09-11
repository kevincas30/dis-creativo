import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { AgendaView } from "@/components/dashboard/agenda/AgendaPageClient";

const VIEW_OPTIONS: { value: AgendaView; label: string }[] = [
  { value: "month", label: "Mes" },
  { value: "week", label: "Semana" },
  { value: "day", label: "Día" },
  { value: "list", label: "Lista" },
];

export default function AgendaHeader({
  view,
  onViewChange,
  referenceLabel,
  onPrev,
  onNext,
  onToday,
  onCreateClick,
}: {
  view: AgendaView;
  onViewChange: (view: AgendaView) => void;
  referenceLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onCreateClick: () => void;
}) {
  return (
    <div className="animate-fade-in-up space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Agenda comercial</h1>
          <p className="text-muted-foreground mt-1 text-sm">Organiza reuniones, entregas y seguimientos del estudio</p>
        </div>

        <button
          type="button"
          onClick={onCreateClick}
          className="shadow-soft inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-all duration-200 ease-out hover:-translate-y-px hover:bg-blue-500 active:translate-y-0 active:scale-[0.97] active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Crear
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="liquid-glass flex items-center gap-0.5 rounded-xl p-1">
            <button
              type="button"
              onClick={onPrev}
              aria-label="Anterior"
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150"
            >
              <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={onToday}
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground rounded-lg px-2.5 py-1 text-xs font-medium transition-colors duration-150"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={onNext}
              aria-label="Siguiente"
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-7 w-7 items-center justify-center rounded-lg transition-colors duration-150"
            >
              <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <span className="text-sm font-medium">{referenceLabel}</span>
        </div>

        <div className="liquid-glass flex items-center gap-0.5 rounded-xl p-1">
          {VIEW_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onViewChange(option.value)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                view === option.value ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
