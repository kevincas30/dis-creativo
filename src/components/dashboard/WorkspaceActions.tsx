"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import CreateProjectModal from "@/components/dashboard/projects/CreateProjectModal";
import Button from "@/components/ui/Button";

export default function WorkspaceActions() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Link href="/presupuestos/nuevo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-zinc-900 shadow-soft transition-all hover:bg-zinc-100">
          <Plus className="h-4 w-4" aria-hidden />
          Nuevo presupuesto
        </Link>
        <Button variant="ghost" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden /> Nuevo proyecto
        </Button>
      </div>
      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
