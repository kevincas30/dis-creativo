"use client";

import { useState, useTransition } from "react";
import { CalendarPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import { EVENT_TYPE_CONFIG, EVENT_TYPE_ORDER } from "@/lib/event-type";
import { toDateInputValue } from "@/lib/dashboard-agenda-dates";
import { createEvent, updateEvent } from "@/app/(dashboard)/agenda/actions";
import type { EventSnapshot } from "@/lib/event-presenter";
import type { EventType } from "@/generated/prisma/enums";

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

export default function CreateEventModal({
  isOpen,
  onClose,
  clients,
  projects,
  defaultDate,
  defaultClientId,
  defaultProjectId,
  defaultPeriodId,
  defaultType,
  event,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  clients: { id: string; name: string }[];
  projects: { id: string; name: string }[];
  defaultDate?: string;
  defaultClientId?: string;
  defaultProjectId?: string;
  defaultPeriodId?: string;
  defaultType?: EventType;
  event?: EventSnapshot | null;
  onCreated: (event: EventSnapshot) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      try {
      if (defaultProjectId) formData.set("projectId", defaultProjectId);
      if (defaultPeriodId) formData.set("periodId", defaultPeriodId);
      const created = event ? await updateEvent(event.id, formData) : await createEvent(formData);
      onCreated(created);
      onClose();
      } catch (error) { setError(error instanceof Error ? error.message : "No se pudo crear el evento."); }
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form action={handleSubmit}>
        {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        <div className="flex items-start gap-3">
          <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <CalendarPlus className="text-foreground h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-base font-semibold tracking-tight">{event ? "Editar evento" : "Nuevo evento"}</h2>
            <p className="text-muted-foreground text-sm">{event ? "Actualiza los datos de la agenda" : "Agrega un evento a la agenda comercial"}</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <Field label="Título" htmlFor="title">
            <input id="title" name="title" required defaultValue={event?.title} placeholder="Reunión con cliente" className={inputClassName} />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Tipo de evento" htmlFor="type">
              <select id="type" name="type" defaultValue={event?.type ?? defaultType ?? "MEETING"} className={inputClassName}>
                {EVENT_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>
                    {EVENT_TYPE_CONFIG[type].label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Cliente" htmlFor="clientId">
              <select id="clientId" name="clientId" defaultValue={event?.clientId ?? defaultClientId ?? ""} className={inputClassName}>
                <option value="">Sin cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Proyecto (opcional)" htmlFor="projectId">
              <select id="projectId" name="projectId" defaultValue={event?.projectId ?? defaultProjectId ?? ""} disabled={!!defaultProjectId} className={inputClassName}>
                <option value="">Sin proyecto</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Fecha" htmlFor="date">
              <input id="date" name="date" type="date" required defaultValue={event ? toDateInputValue(new Date(event.startAt)) : defaultDate ?? toDateInputValue(new Date())} className={inputClassName} />
            </Field>

            <Field label="Hora inicio" htmlFor="startTime">
              <input id="startTime" name="startTime" type="time" required defaultValue={event ? new Date(event.startAt).toTimeString().slice(0, 5) : "10:00"} className={inputClassName} />
            </Field>

            <Field label="Hora fin" htmlFor="endTime">
              <input id="endTime" name="endTime" type="time" required defaultValue={event ? new Date(event.endAt).toTimeString().slice(0, 5) : "11:00"} className={inputClassName} />
            </Field>
          </div>

          <Field label="Ubicación o enlace" htmlFor="location">
            <input id="location" name="location" defaultValue={event?.location ?? ""} placeholder="Oficina, Google Meet..." className={inputClassName} />
          </Field>

          <Field label="Notas" htmlFor="notes">
            <textarea id="notes" name="notes" rows={3} defaultValue={event?.notes ?? ""} placeholder="Detalles del evento..." className={`${inputClassName} resize-none`} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Guardando..." : event ? "Guardar cambios" : "Crear evento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
