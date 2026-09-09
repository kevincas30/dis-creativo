"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { X, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ClientFormFields from "@/components/dashboard/clientes/ClientFormFields";
import { clientFormFeedback } from "@/components/dashboard/clientes/client-form-utils";
import { createClient, findPotentialClientDuplicates } from "@/app/(dashboard)/clientes/actions";
import type { ClientStage } from "@/generated/prisma/enums";

type CreatedClient = { id: string; stage: ClientStage; displayName: string };

export default function CreateClientModal({ isOpen, onClose, onCreated, stage, members }: { isOpen: boolean; onClose: () => void; onCreated: (client: CreatedClient) => void; stage: ClientStage; members: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const label = stage === "PROSPECT" ? "prospecto" : "cliente";

  function requestClose() { if (!isPending) onClose(); }

  function save(formData: FormData, skipDuplicateCheck = false) {
    setError(null);
    setFieldErrors({});
    startTransition(async () => {
      try {
        if (!skipDuplicateCheck) {
          const found = await findPotentialClientDuplicates(formData);
          if (found.length) { setDuplicates(found); return; }
        }
        const created = await createClient(formData);
        onCreated(created);
      } catch (err) {
        const feedback = clientFormFeedback(err, `No se pudo crear el ${label}.`);
        setError(feedback.message);
        setFieldErrors(feedback.field ? { [feedback.field]: feedback.message } : {});
      }
    });
  }

  function submit(formData: FormData) { save(formData); }
  function saveDespiteDuplicates() { if (formRef.current) save(new FormData(formRef.current), true); }

  return <Modal isOpen={isOpen} onClose={requestClose} ariaLabel={`Nuevo ${label}`} className="h-full max-h-dvh max-w-none rounded-none border-0 p-0 sm:h-[min(44rem,calc(100dvh-2rem))] sm:max-w-2xl sm:rounded-2xl sm:border">
    <form ref={formRef} action={submit} className="flex h-full min-h-0 flex-col">
      <header className="border-surface-border flex shrink-0 items-start gap-3 border-b p-4 sm:p-5">
        <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><UserPlus className="text-foreground h-5 w-5" /></div>
        <div className="min-w-0 flex-1"><h2 className="text-base font-semibold">Nuevo {label}</h2><p className="text-muted-foreground text-sm">{stage === "PROSPECT" ? "Guarda el contacto y programa su siguiente acción." : "Crea una relación comercial activa."}</p></div>
        <button type="button" onClick={requestClose} disabled={isPending} aria-label="Cerrar formulario" className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg disabled:opacity-50"><X className="h-4 w-4" /></button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        {error ? <div role="alert" className="mb-4 rounded-xl border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-300">{error}</div> : null}
        <ClientFormFields stage={stage} members={members} fieldErrors={fieldErrors} />
        {duplicates.length ? <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm"><p className="font-medium">Posible contacto duplicado</p><p className="text-muted-foreground mt-1">Coincide por email, teléfono o Instagram. Puedes abrirlo o guardar de todos modos.</p><div className="mt-2 flex flex-wrap gap-2">{duplicates.map((client) => <Link className="underline" href={`/clientes/${client.id}`} key={client.id}>{client.name}</Link>)}</div></div> : null}
      </div>

      <footer className="border-surface-border flex shrink-0 flex-wrap justify-end gap-2 border-t p-4 sm:p-5">
        <Button type="button" variant="ghost" onClick={requestClose} disabled={isPending}>Cancelar</Button>
        {duplicates.length ? <Button type="button" variant="secondary" onClick={saveDespiteDuplicates} disabled={isPending}>Guardar de todos modos</Button> : null}
        <Button type="submit" variant="primary" disabled={isPending}>{isPending ? "Guardando..." : `Crear ${label}`}</Button>
      </footer>
    </form>
  </Modal>;
}
