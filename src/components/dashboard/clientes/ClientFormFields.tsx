import { LEAD_SOURCE_LABEL, LEAD_SOURCE_ORDER, PROSPECT_STATUS_LABEL, PROSPECT_STATUS_ORDER } from "@/lib/client-commercial";
import type { ClientStage, LeadSource, ProspectStatus } from "@/generated/prisma/enums";

const inputClassName = "border-surface-border bg-surface-solid/60 focus-visible:ring-accent/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

function Field({ label, htmlFor, error, children }: { label: string; htmlFor: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label htmlFor={htmlFor} className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</label>{children}{error ? <p id={`${htmlFor}-error`} className="text-xs text-red-400">{error}</p> : null}</div>;
}

function inputProps(error?: string, id?: string) {
  return error ? { "aria-invalid": true, "aria-describedby": id ? `${id}-error` : undefined, className: `${inputClassName} border-red-400/70 focus-visible:ring-red-400/40` } : { className: inputClassName };
}

export type ClientFormDefaults = {
  name?: string; company?: string | null; email?: string | null; phone?: string | null; instagram?: string | null;
  country?: string | null; address?: string | null; website?: string | null; notes?: string | null;
  source?: LeadSource | null; prospectStatus?: ProspectStatus; responsibleId?: string | null;
  nextFollowUp?: { title: string; startAt: string } | null;
};

export default function ClientFormFields({
  stage,
  members,
  defaultValues = {},
  includeFollowUp = true,
  fieldErrors = {},
}: {
  stage: ClientStage;
  members: { id: string; name: string }[];
  defaultValues?: ClientFormDefaults;
  includeFollowUp?: boolean;
  fieldErrors?: Record<string, string | undefined>;
}) {
  const isProspect = stage === "PROSPECT";
  const defaultDate = defaultValues.nextFollowUp?.startAt.slice(0, 10) ?? "";
  const defaultTime = defaultValues.nextFollowUp?.startAt.slice(11, 16) ?? "09:00";
  const followUpEnabled = Boolean(defaultValues.nextFollowUp);
  const invalid = (name: string) => inputProps(fieldErrors[name], name);
  return <div className="client-form space-y-5">
    <input type="hidden" name="stage" value={stage} />
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Field label={isProspect ? "Nombre o referencia" : "Nombre"} htmlFor="name" error={fieldErrors.name}>
        <input id="name" name="name" required autoFocus autoComplete="name" defaultValue={defaultValues.name ?? ""} placeholder={isProspect ? "Ana de Estudio Norte" : "Ana Reyes"} {...invalid("name")} />
      </Field>
      <Field label="Responsable" htmlFor="responsibleId" error={fieldErrors.responsibleId}>
        {members.length === 1 ? <><input type="hidden" name="responsibleId" value={members[0].id} /><div className={`${inputClassName} text-muted-foreground`}>{members[0].name}</div></> : <select id="responsibleId" name="responsibleId" required defaultValue={defaultValues.responsibleId ?? ""} {...invalid("responsibleId")}><option value="">Seleccionar responsable</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}</select>}
      </Field>
    </div>

    <section aria-labelledby="contacto-title" className="space-y-3"><h3 id="contacto-title" className="text-sm font-medium">Contacto</h3><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Email" htmlFor="email" error={fieldErrors.email}><input id="email" name="email" type="email" autoComplete="email" defaultValue={defaultValues.email ?? ""} placeholder="ana@empresa.com" {...invalid("email")} /></Field><Field label="Teléfono o WhatsApp" htmlFor="phone" error={fieldErrors.phone}><input id="phone" name="phone" type="tel" autoComplete="tel" defaultValue={defaultValues.phone ?? ""} placeholder="+34 600 000 000" {...invalid("phone")} /></Field><Field label="Instagram" htmlFor="instagram" error={fieldErrors.instagram}><input id="instagram" name="instagram" autoComplete="off" defaultValue={defaultValues.instagram ?? ""} placeholder="@estudionorte" {...invalid("instagram")} /></Field>{isProspect ? <><Field label="Canal" htmlFor="source"><select id="source" name="source" defaultValue={defaultValues.source ?? ""} className={inputClassName}><option value="">Sin especificar</option>{LEAD_SOURCE_ORDER.map((source) => <option key={source} value={source}>{LEAD_SOURCE_LABEL[source]}</option>)}</select></Field><Field label="Estado" htmlFor="prospectStatus"><select id="prospectStatus" name="prospectStatus" defaultValue={defaultValues.prospectStatus ?? "NEW"} className={inputClassName}>{PROSPECT_STATUS_ORDER.filter((status) => status !== "WON").map((status) => <option key={status} value={status}>{PROSPECT_STATUS_LABEL[status]}</option>)}</select></Field></> : <Field label="Canal" htmlFor="source"><select id="source" name="source" defaultValue={defaultValues.source ?? ""} className={inputClassName}><option value="">Sin especificar</option>{LEAD_SOURCE_ORDER.map((source) => <option key={source} value={source}>{LEAD_SOURCE_LABEL[source]}</option>)}</select></Field>}</div></section>

    {includeFollowUp ? <section aria-labelledby="follow-up-title" className="border-surface-border space-y-3 rounded-xl border p-3"><div><h3 id="follow-up-title" className="text-sm font-medium">Próximo seguimiento</h3><p className="text-muted-foreground text-xs">Se crea un evento real y aparece en Agenda.</p></div><div className="flex flex-wrap gap-x-4 gap-y-2 text-sm"><label><input type="radio" name="followUpMode" value="NONE" defaultChecked={!followUpEnabled} /> Sin seguimiento</label><label><input type="radio" name="followUpMode" value="SCHEDULE" defaultChecked={followUpEnabled} /> Programar seguimiento</label></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Field label="Próxima" htmlFor="followUpDate" error={fieldErrors.followUpDate}><div className="grid grid-cols-2 gap-2"><input id="followUpDate" name="followUpDate" type="date" autoComplete="off" defaultValue={defaultDate} {...invalid("followUpDate")} /><input name="followUpTime" type="time" autoComplete="off" defaultValue={defaultTime} className={inputClassName} /></div></Field><Field label="Próxima acción" htmlFor="followUpTitle"><input id="followUpTitle" name="followUpTitle" autoComplete="off" defaultValue={defaultValues.nextFollowUp?.title ?? ""} placeholder="Seguimiento comercial" className={inputClassName} /></Field></div></section> : null}

    <details className="border-surface-border rounded-xl border"><summary className="cursor-pointer px-3 py-3 text-sm font-medium">Más información</summary><div className="grid grid-cols-1 gap-4 border-t border-surface-border p-3 sm:grid-cols-2"><Field label="Empresa" htmlFor="company"><input id="company" name="company" autoComplete="organization" defaultValue={defaultValues.company ?? ""} className={inputClassName} /></Field><Field label="País" htmlFor="country"><input id="country" name="country" autoComplete="country-name" defaultValue={defaultValues.country ?? ""} className={inputClassName} /></Field><Field label="Sitio web" htmlFor="website"><input id="website" name="website" type="url" autoComplete="url" defaultValue={defaultValues.website ?? ""} placeholder="https://..." className={inputClassName} /></Field><Field label="Dirección" htmlFor="address"><input id="address" name="address" autoComplete="street-address" defaultValue={defaultValues.address ?? ""} className={inputClassName} /></Field><div className="sm:col-span-2"><Field label="Notas internas" htmlFor="notes"><textarea id="notes" name="notes" rows={3} defaultValue={defaultValues.notes ?? ""} className={`${inputClassName} resize-none`} /></Field></div></div></details>
  </div>;
}
