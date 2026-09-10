"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, ArrowLeft, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Modal from "@/components/ui/Modal";
import ProjectFormFields from "@/components/dashboard/projects/ProjectFormFields";
import { updateProject, deleteProject, setProjectArchived } from "@/app/(dashboard)/projects/actions";
import type { ProjectSnapshot } from "@/lib/project-presenter";

export default function ProjectDetailClient({ project: initialProject, role }: { project: ProjectSnapshot; role: "ADMIN" | "MEMBER" }) {
  const router = useRouter();
  const [project, setProject] = useState(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        setProject(await updateProject(project.id, formData));
        setIsEditing(false);
        router.refresh();
      } catch (error) {
        setError(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
      }
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      try {
        await deleteProject(project.id);
      } catch (error) {
        if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
        setError(error instanceof Error ? error.message : "No se pudo eliminar el proyecto.");
        setIsDeleteOpen(false);
      }
    });
  }

  function handleArchive() {
    startTransition(async () => {
      try { await setProjectArchived(project.id, !project.archivedAt); router.push("/projects"); router.refresh(); }
      catch (error) { setError(error instanceof Error ? error.message : "No se pudo archivar el proyecto."); }
    });
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <Link href="/projects" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Proyectos
      </Link>
      <div className="relative">
        <Button type="button" variant="ghost" className="h-10 w-10 px-0" aria-label="Más acciones" onClick={() => setIsMenuOpen((open) => !open)}>
          <MoreHorizontal className="h-5 w-5" />
        </Button>
        {isMenuOpen ? <div className="bg-surface-solid border-surface-border absolute right-0 z-20 mt-2 w-48 rounded-xl border p-1 shadow-elevated">
          <button type="button" className="hover:bg-foreground/5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm" onClick={() => { setIsEditing(true); setIsMenuOpen(false); }}><Pencil className="h-4 w-4" /> Editar proyecto</button>
          {role === "ADMIN" ? <><button type="button" className="hover:bg-foreground/5 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm" onClick={() => { handleArchive(); setIsMenuOpen(false); }}><Archive className="h-4 w-4" /> Archivar proyecto</button><button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10" onClick={() => { setIsDeleteOpen(true); setIsMenuOpen(false); }}><Trash2 className="h-4 w-4" /> Eliminar proyecto</button></> : null}
        </div> : null}
      </div>
      {error ? <p role="alert" className="fixed right-5 bottom-5 z-30 rounded-xl border border-red-400/30 bg-surface-solid px-4 py-3 text-sm text-red-400 shadow-elevated">{error}</p> : null}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} className="max-w-2xl">
        <form action={handleSubmit}>
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold">Editar proyecto</h2><p className="text-muted-foreground mt-1 text-sm">Los estados y la entrega se gestionan desde el resumen diario.</p></div><Button type="button" variant="ghost" className="h-9 w-9 px-0" onClick={() => setIsEditing(false)} aria-label="Cerrar"><X className="h-4 w-4" /></Button></div>
          <div className="mt-5"><ProjectFormFields includeStatus={false} defaultValues={{ name: project.name, client: project.client, type: project.type, dueDate: project.dueDate, owner: project.owner, description: project.description, progress: project.progress }} /></div>
          <div className="mt-6 flex justify-end gap-2"><Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>Cancelar</Button><Button type="submit" disabled={isPending}>{isPending ? "Guardando..." : "Guardar cambios"}</Button></div>
        </form>
      </Modal>
      <ConfirmDialog isOpen={isDeleteOpen} title="Eliminar proyecto" description={`Se eliminará "${project.name}" permanentemente. Esta acción no se puede deshacer.`} confirmLabel="Eliminar" pendingLabel="Eliminando..." icon={Trash2} isPending={isDeletePending} onConfirm={handleDelete} onClose={() => setIsDeleteOpen(false)} />
    </div>
  );
}
