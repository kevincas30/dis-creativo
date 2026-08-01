import { User, Building2, Globe, Briefcase, Hash, Calendar } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const INTAKE_FIELDS: Array<{ icon: LucideIcon; label: string; optional?: boolean }> = [
  { icon: User, label: "Cliente" },
  { icon: Building2, label: "Empresa", optional: true },
  { icon: Globe, label: "País" },
  { icon: Briefcase, label: "Servicio o proyecto" },
  { icon: Hash, label: "Cantidad o alcance" },
  { icon: Calendar, label: "Fecha límite", optional: true },
];

export default function IntakeFormCard() {
  return (
    <div className="max-w-[480px]">
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Nuevo presupuesto</h2>
        <p className="text-muted-foreground mt-1 text-sm">Completa estos datos para generar la cotización.</p>
      </div>

      <div className="bg-surface border-surface-border animate-fade-in-up rounded-2xl border p-5">
        <div className="space-y-3.5">
          {INTAKE_FIELDS.map((field) => (
            <div key={field.label} className="flex items-center gap-3 text-sm">
              <span className="border-surface-border bg-foreground/5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border">
                <field.icon className="text-muted-foreground h-4 w-4" strokeWidth={1.75} />
              </span>
              <span>
                {field.label}
                {field.optional ? <span className="text-muted-foreground"> (opcional)</span> : null}
              </span>
            </div>
          ))}
        </div>

        <div className="border-surface-border bg-foreground/5 mt-5 rounded-xl border p-3">
          <p className="text-muted-foreground text-xs leading-relaxed">
            Ejemplo: Necesito una cotización para 8 carruseles mensuales para Amare Studio en México.
          </p>
        </div>
      </div>
    </div>
  );
}
