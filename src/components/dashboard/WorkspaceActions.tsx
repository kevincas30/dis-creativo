"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createDraftQuote } from "@/app/presupuestos/quotes/actions";
import CreateProjectModal from "@/components/dashboard/projects/CreateProjectModal";
import Button from "@/components/ui/Button";

export default function WorkspaceActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleCreateQuote() {
    startTransition(async () => {
      // Los errores de navegación de redirect deben llegar a Next.js.
      await createDraftQuote();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={handleCreateQuote} disabled={isPending}>
          <Plus className="h-4 w-4" aria-hidden />
          {isPending ? "Creando…" : "Nuevo presupuesto"}
        </Button>
        <Button variant="ghost" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Nuevo proyecto
        </Button>
      </div>
      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
