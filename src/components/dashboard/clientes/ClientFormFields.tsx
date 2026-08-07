import { CLIENT_STATUS_CONFIG, CLIENT_STATUS_ORDER } from "@/lib/client-status";
import type { ClientStatus } from "@/generated/prisma/enums";

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

export type ClientFormDefaults = {
  firstName?: string | null;
  lastName?: string | null;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  status?: ClientStatus;
};

export default function ClientFormFields({ defaultValues = {} }: { defaultValues?: ClientFormDefaults }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="firstName">
          <input id="firstName" name="firstName" required defaultValue={defaultValues.firstName ?? ""} placeholder="Ana" className={inputClassName} />
        </Field>

        <Field label="Apellidos" htmlFor="lastName">
          <input id="lastName" name="lastName" required defaultValue={defaultValues.lastName ?? ""} placeholder="Reyes" className={inputClassName} />
        </Field>

        <Field label="Empresa" htmlFor="company">
          <input id="company" name="company" defaultValue={defaultValues.company ?? ""} placeholder="Mariscos Palace" className={inputClassName} />
        </Field>

        <Field label="Email" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={defaultValues.email ?? ""}
            placeholder="ana@mariscospalace.com"
            className={inputClassName}
          />
        </Field>

        <Field label="Teléfono" htmlFor="phone">
          <input id="phone" name="phone" defaultValue={defaultValues.phone ?? ""} placeholder="+52 55 1234 5678" className={inputClassName} />
        </Field>

        <Field label="País" htmlFor="country">
          <input id="country" name="country" defaultValue={defaultValues.country ?? ""} placeholder="México" className={inputClassName} />
        </Field>

        <Field label="Sitio web" htmlFor="website">
          <input id="website" name="website" defaultValue={defaultValues.website ?? ""} placeholder="https://..." className={inputClassName} />
        </Field>

        <Field label="Estado" htmlFor="status">
          <select id="status" name="status" defaultValue={defaultValues.status ?? "ACTIVE"} className={inputClassName}>
            {CLIENT_STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {CLIENT_STATUS_CONFIG[status].label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Dirección" htmlFor="address">
        <input id="address" name="address" defaultValue={defaultValues.address ?? ""} placeholder="Calle, ciudad..." className={inputClassName} />
      </Field>

      <Field label="Notas internas" htmlFor="notes">
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes ?? ""}
          placeholder="Notas sobre este cliente..."
          className={`${inputClassName} resize-none`}
        />
      </Field>
    </div>
  );
}
