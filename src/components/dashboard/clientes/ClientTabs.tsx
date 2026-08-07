export type ClientTabId = "overview" | "projects" | "quotes" | "agenda" | "payments" | "documents" | "activity";

const TABS: { id: ClientTabId; label: string }[] = [
  { id: "overview", label: "Resumen" },
  { id: "projects", label: "Proyectos" },
  { id: "quotes", label: "Presupuestos" },
  { id: "agenda", label: "Agenda" },
  { id: "payments", label: "Pagos" },
  { id: "documents", label: "Documentos" },
  { id: "activity", label: "Actividad" },
];

export default function ClientTabs({ active, onChange }: { active: ClientTabId; onChange: (tab: ClientTabId) => void }) {
  return (
    <div className="border-surface-border flex gap-1 overflow-x-auto border-b">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
            active === tab.id
              ? "border-accent text-foreground"
              : "text-muted-foreground hover:text-foreground border-transparent"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
