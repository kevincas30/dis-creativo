"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Archive } from "lucide-react";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { setClientArchived } from "@/app/(dashboard)/clientes/actions";
export default function ArchiveClientButton({ id, archived }: { id: string; archived: boolean }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return <div className="my-5 space-y-2"><Button variant="ghost" onClick={() => setOpen(true)}>{archived ? "Restaurar cliente" : "Archivar cliente"}</Button>{archived && <p className="text-sm text-muted-foreground">Cliente archivado. Su historial y relaciones se conservan.</p>}{error && <p role="alert" className="text-sm text-red-400">{error}</p>}<ConfirmDialog isOpen={open} title={archived ? "Restaurar cliente" : "Archivar cliente"} description="Se actualizará su archivo en la base de datos. No se borrarán presupuestos, proyectos, periodos, tareas, agenda, pagos ni actividad. Puedes restaurarlo después." confirmLabel={archived ? "Restaurar" : "Archivar"} pendingLabel="Guardando…" icon={Archive} isPending={pending} onClose={() => setOpen(false)} onConfirm={() => start(async () => { const result = await setClientArchived(id, !archived); setError(result.error); if (!result.error) { setOpen(false); router.refresh(); } })} /></div>;
}
