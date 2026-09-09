import { LEAD_SOURCE_LABEL, LEAD_SOURCE_ORDER, PROSPECT_STATUS_LABEL, PROSPECT_STATUS_ORDER } from "@/lib/client-commercial";
import type { ClientStage, LeadSource, ProspectStatus } from "@/generated/prisma/enums";

const inputClassName = "border-surface-border bg-surface-solid/60 focus-visible:ring-accent/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2";

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><label htmlFor={htmlFor} className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</label>{children}</div>;
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
}: {
  stage: ClientStage;
  members: { id: string; name: string }[];
  defaultValues?: ClientFormDefaults;
  includeFollowUp?: boolean;
}) {
  const isProspect = stage === "PROSPECT";
  const defaultDate = defaultValues.nextFollowUp?.startAt.slice(0, 10) ?? "";
  const defaultTime = defaultValues.nextFollowUp?.startAt.slice(11, 16) ?? "09:00";
  const followUpEnabled = Boolean(defaultValues.nextFollowUp);
  return (
    <div className="space-y-4">
      <input type="hidden" name="stage" value={stage} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={isProspect ? "Nombre o referencia" : "Nombre"} htmlFor="name">
          <input id="name" name="name" required defaultValue={defaultValues.name ?? ""} placeholder={isProspect ? "Ana de Estudio Norte" : "Ana Reyes"} className={inputClassName} />
        </Field>
        <Field label="Responsable" htmlFor="responsibleId">
          {members.length === 1 ? <><input type="hidden" name="responsibleId" value={members[0].id} /><div className={`${inputClassName} text-muted-foreground`}>{members[0].name}</div></> : (
            <select id="responsibleId" name="responsibleId" required defaultValue={defaultValues.responsibleId ?? ""} className={inputClassName}>
              <option value="">Seleccionar responsable</option>{members.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
            </select>
          )}
        </Field>
        <Field label="Empresa" htmlFor="company"><input id="company" name="company" defaultValue={defaultValues.company ?? ""} className={inputClassName} /></Field>
        <Field label="Email" htmlFor="email"><input id="email" name="email" type="email" defaultValue={defaultValues.email ?? ""} placeholder="ana@empresa.com" className={inputClassName} /></Field>
        <Field label="Teléfono o WhatsApp" htmlFor="phone"><input id="phone" name="phone" defaultValue={defaultValues.phone ?? ""} placeholder="+34 600 000 000" className={inputClassName} /></Field>
        <Field label="Instagram" htmlFor="instagram"><input id="instagram" name="instagram" defaultValue={defaultValues.instagram ?? ""} placeholder="@estudionorte" className={inputClassName} /></Field>
        {isProspect ? <>
          <Field label="Canal" htmlFor="source"><select id="source" name="source" defaultValue={defaultValues.source ?? ""} className={inputClassName}><option value="">Sin especificar</option>{LEAD_SOURCE_ORDER.map((source) => <option key={source} value={source}>{LEAD_SOURCE_LABEL[source]}</option>)}</select></Field>
          <Field label="Estado" htmlFor="prospectStatus"><select id="prospectStatus" name="prospectStatus" defaultValue={defaultValues.prospectStatus ?? "NEW"} className={inputClassName}>{PROSPECT_STATUS_ORDER.filter((status) => !["WON"].includes(status)).map((status) => <option key={status} value={status}>{PROSPECT_STATUS_LABEL[status]}</option>)}</select></Field>
        </> : null}
        <Field label="País" htmlFor="country"><input id="country" name="country" defaultValue={defaultValues.country ?? ""} className={inputClassName} /></Field>
        <Field label="Sitio web" htmlFor="website"><input id="website" name="website" defaultValue={defaultValues.website ?? ""} placeholder="https://..." className={inputClassName} /></Field>
      </div>
      <Field label="Dirección" htmlFor="address"><input id="address" name="address" defaultValue={defaultValues.address ?? ""} className={inputClassName} /></Field>
      <Field label="Notas internas" htmlFor="notes"><textarea id="notes" name="notes" rows={3} defaultValue={defaultValues.notes ?? ""} className={`${inputClassName} resize-none`} /></Field>
      {includeFollowUp ? <div className="border-surface-border space-y-3 rounded-xl border p-3"><p className="text-sm font-medium">Próxima acción</p><div className="flex gap-4 text-sm"><label><input type="radio" name="followUpMode" value="NONE" defaultChecked={!followUpEnabled} /> Sin seguimiento</label><label><input type="radio" name="followUpMode" value="SCHEDULE" defaultChecked={followUpEnabled} /> Programar seguimiento</label></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-3"><input name="followUpDate" type="date" defaultValue={defaultDate} className={inputClassName} /><input name="followUpTime" type="time" defaultValue={defaultTime} className={inputClassName} /><input name="followUpTitle" defaultValue={defaultValues.nextFollowUp?.title ?? ""} placeholder="Seguimiento comercial" className={inputClassName} /></div></div> : null}
    </div>
  );
}
