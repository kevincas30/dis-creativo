"use client";

import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ClientFormFields from "@/components/dashboard/clientes/ClientFormFields";
import { createClient } from "@/app/(dashboard)/clientes/actions";

export default function CreateClientModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        await createClient(formData);
      } catch (err) {
        // redirect() de Next.js lanza un error especial con digest
        // "NEXT_REDIRECT" que debe propagarse, no tratarse como fallo.
        if (err && typeof err === "object" && "digest" in err && typeof err.digest === "string" && err.digest.startsWith("NEXT_REDIRECT")) {
          throw err;
        }
        setError(err instanceof Error ? err.message : "No se pudo crear el cliente.");
      }
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form action={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <UserPlus className="text-foreground h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-base font-semibold tracking-tight">Nuevo cliente</h2>
            <p className="text-muted-foreground text-sm">Agrega un cliente al CRM del estudio</p>
          </div>
        </div>

        <div className="mt-5">
          <ClientFormFields />
        </div>

        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Creando..." : "Crear cliente"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
