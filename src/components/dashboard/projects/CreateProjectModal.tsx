"use client";

import { useEffect, useState, useTransition } from "react";
import { getProjectOptions } from "@/app/(dashboard)/projects/work-actions";
import { FolderPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ProjectFormFields from "@/components/dashboard/projects/ProjectFormFields";
import { createProject } from "@/app/(dashboard)/projects/actions";

export default function CreateProjectModal({
  isOpen,
  onClose,
  defaultClient,
  defaultClientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultClient?: string;
  defaultClientId?: string;
}) {
  const [isPending, startTransition] = useTransition();

  const [options, setOptions] = useState<Awaited<ReturnType<typeof getProjectOptions>>>({ clients: [], quotes: [] });
  const [clientId, setClientId] = useState(defaultClientId ?? "");
  useEffect(() => { if (isOpen) { let active = true; getProjectOptions().then((result) => { if (active) setOptions(result); }).catch(() => {}); return () => { active = false; }; } }, [isOpen]);
  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      if (clientId) formData.set("client", options.clients.find((c) => c.id === clientId)?.name ?? defaultClient ?? "");
      await createProject(formData);
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-lg">
      <form action={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <FolderPlus className="text-foreground h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className="text-base font-semibold tracking-tight">Nuevo proyecto</h2>
            <p className="text-muted-foreground text-sm">Agrega un proyecto al tablero del estudio</p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="grid gap-2 text-sm">Modalidad<select name="kind" className="rounded-lg bg-surface-solid border border-surface-border p-2"><option value="ONE_OFF">Proyecto único</option><option value="RECURRING">Proyecto recurrente / mensual</option></select></label>
          <label className="grid gap-2 text-sm">Vincular cliente<select name="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} className="rounded-lg bg-surface-solid border border-surface-border p-2"><option value="">Sin vínculo (nombre libre abajo)</option>{options.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="grid gap-2 text-sm">Presupuesto de origen<select name="quoteId" className="rounded-lg bg-surface-solid border border-surface-border p-2"><option value="">Sin presupuesto</option>{options.quotes.filter((q) => q.clientId === clientId).map((q) => <option key={q.id} value={q.id}>{q.createdAt.slice(0, 10)} · {q.id.slice(0, 8)}</option>)}</select></label>
          <ProjectFormFields hideClient={Boolean(clientId)} defaultValues={defaultClient ? { client: defaultClient } : undefined} />
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending}>
            {isPending ? "Creando..." : "Crear proyecto"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
