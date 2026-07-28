"use client";

import { useState, type FormEvent } from "react";
import { Pencil } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function RenameUserModal({
  isOpen,
  currentName,
  isPending,
  onSave,
  onClose,
}: {
  isOpen: boolean;
  currentName: string;
  isPending: boolean;
  onSave: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(currentName);
  // Sincroniza el borrador con currentName cada vez que el modal se abre —
  // patrón de "ajustar estado durante el render" (sin efecto) recomendado por React
  // para resetear estado derivado de props: https://react.dev/learn/you-might-not-need-an-effect
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setName(currentName);
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave(trimmed);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
            <Pencil className="text-foreground h-5 w-5" strokeWidth={1.75} />
          </div>
          <div className="flex-1 space-y-2 pt-1">
            <h2 className="text-base font-semibold tracking-tight">Cambiar nombre de usuario</h2>
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={60}
              placeholder="Tu nombre"
              className="border-surface-border bg-surface-solid/60 focus-visible:ring-accent/40 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-2"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" disabled={isPending || !name.trim()}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
