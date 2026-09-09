"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ClientFormFields from "@/components/dashboard/clientes/ClientFormFields";
import { createClient, findPotentialClientDuplicates } from "@/app/(dashboard)/clientes/actions";
import type { ClientStage } from "@/generated/prisma/enums";

export default function CreateClientModal({ isOpen, onClose, stage, members }: { isOpen: boolean; onClose: () => void; stage: ClientStage; members: { id: string; name: string }[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<{ id: string; name: string }[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const label = stage === "PROSPECT" ? "prospecto" : "cliente";

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        if (!confirmed) {
          const found = await findPotentialClientDuplicates(formData);
          if (found.length) { setDuplicates(found); return; }
        }
        await createClient(formData);
      } catch (err) {
        if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) throw err;
        setError(err instanceof Error ? err.message : `No se pudo crear el ${label}.`);
      }
    });
  }

  return <Modal isOpen={isOpen} onClose={onClose} className="max-w-2xl"><form action={submit}>
    <div className="flex items-start gap-3"><div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"><UserPlus className="text-foreground h-5 w-5" /></div><div><h2 className="text-base font-semibold">Nuevo {label}</h2><p className="text-muted-foreground text-sm">{stage === "PROSPECT" ? "Guarda el contacto y programa su siguiente acción." : "Crea una relación comercial activa."}</p></div></div>
    <div className="mt-5"><ClientFormFields stage={stage} members={members} /></div>
    {duplicates.length ? <div className="mt-4 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm"><p className="font-medium">Posible contacto duplicado</p><p className="text-muted-foreground mt-1">Coincide por email, teléfono o Instagram. Puedes abrirlo o guardar de todos modos.</p><div className="mt-2 flex flex-wrap gap-2">{duplicates.map((client) => <Link className="underline" href={`/clientes/${client.id}`} key={client.id}>{client.name}</Link>)}</div></div> : null}
    {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>Cancelar</Button>{duplicates.length && !confirmed ? <Button type="button" variant="secondary" onClick={() => { setConfirmed(true); setDuplicates([]); }}>Guardar de todos modos</Button> : null}<Button type="submit" variant="primary" disabled={isPending}>{isPending ? "Guardando..." : `Crear ${label}`}</Button></div>
  </form></Modal>;
}
