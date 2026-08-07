"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Pencil, Trash2, X } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import ProjectFormFields from "@/components/dashboard/projects/ProjectFormFields";
import { PROJECT_STATUS_CONFIG } from "@/lib/project-status";
import { updateProject, deleteProject } from "@/app/(dashboard)/projects/actions";
import type { ProjectSnapshot } from "@/lib/project-presenter";

function formatDueDate(value: string | null): string {
  if (!value) return "Sin fecha de entrega";
  return new Date(value).toLocaleDateString("es-MX", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProjectDetailClient({ project: initialProject }: { project: ProjectSnapshot }) {
  const [project, setProject] = useState(initialProject);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const config = PROJECT_STATUS_CONFIG[project.status];

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const updated = await updateProject(project.id, formData);
      setProject(updated);
      setIsEditing(false);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      await deleteProject(project.id);
    });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Proyectos
      </Link>

      <div
        className="liquid-glass animate-fade-in-up rounded-2xl p-6"
        style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
      >
        {isEditing ? (
          <form action={handleSubmit}>
            <ProjectFormFields
              includeStatus
              defaultValues={{
                name: project.name,
                client: project.client,
                type: project.type,
                dueDate: project.dueDate,
                owner: project.owner,
                description: project.description,
                status: project.status,
                progress: project.progress,
              }}
            />

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                <X className="h-4 w-4" strokeWidth={1.75} />
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">{project.client}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badgeClassName}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            </div>

            <div className="mt-5">
              <div className="bg-foreground/10 h-1.5 w-full overflow-hidden rounded-full">
                <div className="bg-accent h-full rounded-full transition-all duration-300" style={{ width: `${project.progress}%` }} />
              </div>
              <p className="text-muted-foreground mt-1.5 text-xs">{project.progress}% completado</p>
            </div>

            <div className="border-surface-border mt-5 grid grid-cols-1 gap-4 border-t pt-5 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Tipo</p>
                <p className="mt-1 text-sm">{project.type ?? "Sin especificar"}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Entrega</p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  {formatDueDate(project.dueDate)}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Responsable</p>
                <div className="mt-1 flex items-center gap-2">
                  <Avatar name={project.owner ?? "?"} className="h-6 w-6 text-[10px]" />
                  <span className="text-sm">{project.owner ?? "Sin asignar"}</span>
                </div>
              </div>
            </div>

            {project.description ? (
              <div className="border-surface-border mt-5 border-t pt-5">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Descripción</p>
                <p className="text-foreground mt-1.5 text-sm whitespace-pre-wrap">{project.description}</p>
              </div>
            ) : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsDeleteOpen(true)}>
                <Trash2 className="h-4 w-4" strokeWidth={1.75} />
                Eliminar
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar proyecto
              </Button>
            </div>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Eliminar proyecto"
        description={`Se eliminará "${project.name}" permanentemente. Esta acción no se puede deshacer.`}
        confirmLabel="Eliminar"
        pendingLabel="Eliminando..."
        icon={Trash2}
        isPending={isDeletePending}
        onConfirm={handleDelete}
        onClose={() => setIsDeleteOpen(false)}
      />
    </div>
  );
}
