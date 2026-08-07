import { PROJECT_STATUS_CONFIG, PROJECT_STATUS_ORDER } from "@/lib/project-status";
import type { ProjectStatus } from "@/generated/prisma/enums";

const inputClassName =
  "border-surface-border bg-surface-solid/60 focus-visible:ring-accent/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

export type ProjectFormDefaults = {
  name?: string;
  client?: string;
  type?: string | null;
  dueDate?: string | null;
  owner?: string | null;
  description?: string | null;
  status?: ProjectStatus;
  progress?: number;
};

export default function ProjectFormFields({
  defaultValues = {},
  includeStatus = false,
}: {
  defaultValues?: ProjectFormDefaults;
  includeStatus?: boolean;
}) {
  const dueDateValue = defaultValues.dueDate ? defaultValues.dueDate.slice(0, 10) : "";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="name">
          <input
            id="name"
            name="name"
            required
            defaultValue={defaultValues.name}
            placeholder="Web Mariscos Palace"
            className={inputClassName}
          />
        </Field>

        <Field label="Cliente" htmlFor="client">
          <input
            id="client"
            name="client"
            required
            defaultValue={defaultValues.client}
            placeholder="Mariscos Palace"
            className={inputClassName}
          />
        </Field>

        <Field label="Tipo de proyecto" htmlFor="type">
          <input
            id="type"
            name="type"
            defaultValue={defaultValues.type ?? ""}
            placeholder="Sitio web, branding..."
            className={inputClassName}
          />
        </Field>

        <Field label="Fecha de entrega" htmlFor="dueDate">
          <input id="dueDate" name="dueDate" type="date" defaultValue={dueDateValue} className={inputClassName} />
        </Field>

        <Field label="Responsable" htmlFor="owner">
          <input
            id="owner"
            name="owner"
            defaultValue={defaultValues.owner ?? ""}
            placeholder="Nombre del responsable"
            className={inputClassName}
          />
        </Field>

        {includeStatus ? (
          <Field label="Estado" htmlFor="status">
            <select id="status" name="status" defaultValue={defaultValues.status ?? "NOT_STARTED"} className={inputClassName}>
              {PROJECT_STATUS_ORDER.map((status) => (
                <option key={status} value={status}>
                  {PROJECT_STATUS_CONFIG[status].label}
                </option>
              ))}
            </select>
          </Field>
        ) : null}
      </div>

      {includeStatus ? (
        <Field label="Progreso (%)" htmlFor="progress">
          <input
            id="progress"
            name="progress"
            type="number"
            min={0}
            max={100}
            defaultValue={defaultValues.progress ?? 0}
            className={inputClassName}
          />
        </Field>
      ) : null}

      <Field label="Descripción" htmlFor="description">
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues.description ?? ""}
          placeholder="Detalles del proyecto..."
          className={`${inputClassName} resize-none`}
        />
      </Field>
    </div>
  );
}
