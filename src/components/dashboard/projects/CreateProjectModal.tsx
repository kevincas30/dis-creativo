"use client";

import { useTransition } from "react";
import { FolderPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import ProjectFormFields from "@/components/dashboard/projects/ProjectFormFields";
import { createProject } from "@/app/(dashboard)/projects/actions";

export default function CreateProjectModal({
  isOpen,
  onClose,
  defaultClient,
}: {
  isOpen: boolean;
  onClose: () => void;
  defaultClient?: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
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

        <div className="mt-5">
          <ProjectFormFields defaultValues={defaultClient ? { client: defaultClient } : undefined} />
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
