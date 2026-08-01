"use client";

import { AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirmar",
  pendingLabel,
  tone = "danger",
  icon,
  isPending = false,
  onConfirm,
  onClose,
}: {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  pendingLabel?: string;
  tone?: "danger" | "default";
  icon?: LucideIcon;
  isPending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const Icon = icon ?? AlertTriangle;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            tone === "danger" ? "bg-red-500/10" : "bg-accent-soft"
          }`}
        >
          <Icon className={`h-5 w-5 ${tone === "danger" ? "text-red-500" : "text-foreground"}`} strokeWidth={1.75} />
        </div>
        <div className="space-y-1 pt-1">
          <h2 className="text-base font-semibold tracking-tight">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          Cancelar
        </Button>
        <Button type="button" variant={tone === "danger" ? "danger" : "primary"} onClick={onConfirm} disabled={isPending}>
          {isPending ? (pendingLabel ?? "Procesando...") : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
