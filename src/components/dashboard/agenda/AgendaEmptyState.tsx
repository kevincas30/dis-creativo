import { CalendarDays, Plus } from "lucide-react";

export default function AgendaEmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <div
        className="liquid-glass animate-fade-in-up flex w-full max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center"
        style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
      >
        <div className="bg-accent-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <CalendarDays className="text-foreground h-6 w-6" strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">Aún no tienes eventos</h2>
          <p className="text-muted-foreground text-sm">
            Agenda tu primera reunión, entrega o seguimiento para empezar a organizar el estudio.
          </p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="shadow-soft inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-all duration-200 ease-out hover:-translate-y-px hover:bg-blue-500 active:translate-y-0 active:scale-[0.97] active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Crear mi primer evento
        </button>
      </div>
    </div>
  );
}
