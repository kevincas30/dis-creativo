"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Copy, FileDown, Trash2, Loader2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { duplicateQuote, deleteQuote } from "@/app/presupuestos/quotes/actions";
import { useMounted } from "@/components/ui/Modal";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

type Action = "duplicate" | "delete" | null;
type MenuPosition = { top: number; right: number };

export default function QuoteActionsMenu({
  quoteId,
  isActive,
  className = "",
}: {
  quoteId: string;
  isActive: boolean;
  className?: string;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [pendingAction, setPendingAction] = useState<Action>(null);
  const [isPending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pdfConfirmOpen, setPdfConfirmOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (containerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
      }
      return next;
    });
  }

  function handleEdit() {
    setIsOpen(false);
    router.push(`/presupuestos/quotes/${quoteId}`);
  }

  function handleDuplicate() {
    setPendingAction("duplicate");
    startTransition(async () => {
      await duplicateQuote(quoteId);
    });
  }

  function handleExportPdf() {
    // Descarga directa: el Content-Disposition del route handler ya fuerza
    // el diálogo nativo de descarga, sin necesidad de Blob/fetch en cliente.
    window.location.href = `/api/quotes/${quoteId}/pdf`;
    setPdfConfirmOpen(false);
  }

  function handleDeleteConfirmed() {
    setPendingAction("delete");
    startTransition(async () => {
      await deleteQuote(quoteId);
      setConfirmOpen(false);
      setPendingAction(null);
      if (isActive) {
        // Si el presupuesto activo se elimina, hay que navegar lejos de su ruta
        // en vez de refrescarla: refrescar aquí volvería a pedir datos de una
        // ruta que ya no existe en la base de datos y mostraría un 404.
        router.push("/");
      } else {
        router.refresh();
      }
    });
  }

  return (
    <>
      <div ref={containerRef} className={className}>
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleToggle();
          }}
          aria-label="Más acciones"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          className={`flex h-10 w-10 items-center justify-center rounded-md transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-accent/40 ${
            isOpen ? "bg-foreground/10 text-foreground" : "text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
          }`}
        >
          <MoreHorizontal className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {mounted && isOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuPos.top, right: menuPos.right }}
              className="bg-surface-solid/95 border-surface-border shadow-elevated animate-scale-in fixed z-20 w-44 origin-top-right overflow-hidden rounded-xl border py-1 backdrop-blur-sm"
            >
              <MenuItem icon={Pencil} label="Editar" onSelect={handleEdit} />
              <MenuItem
                icon={Copy}
                label="Duplicar"
                isLoading={isPending && pendingAction === "duplicate"}
                onSelect={handleDuplicate}
              />
              <MenuItem
                icon={FileDown}
                label="Exportar PDF"
                onSelect={() => {
                  setIsOpen(false);
                  setPdfConfirmOpen(true);
                }}
              />
              <div className="border-surface-border my-1 border-t" />
              <MenuItem
                icon={Trash2}
                label="Eliminar"
                tone="danger"
                onSelect={() => {
                  setIsOpen(false);
                  setConfirmOpen(true);
                }}
              />
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialog
        isOpen={confirmOpen}
        title="Eliminar presupuesto"
        description="Esta acción no se puede deshacer. Se eliminará el presupuesto junto con su conversación y líneas asociadas."
        confirmLabel="Eliminar"
        isPending={isPending && pendingAction === "delete"}
        onConfirm={handleDeleteConfirmed}
        onClose={() => setConfirmOpen(false)}
      />

      <ConfirmDialog
        isOpen={pdfConfirmOpen}
        tone="default"
        icon={FileDown}
        title="Exportar a PDF"
        description="¿Deseas generar el PDF de este presupuesto? Se descargará al instante con el diseño de Diseño Creativo."
        confirmLabel="Sí, generar"
        onConfirm={handleExportPdf}
        onClose={() => setPdfConfirmOpen(false)}
      />
    </>
  );
}

function MenuItem({
  icon: Icon,
  label,
  tone = "default",
  isLoading = false,
  onSelect,
}: {
  icon: LucideIcon;
  label: string;
  tone?: "default" | "danger";
  isLoading?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={isLoading}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelect();
      }}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-150 disabled:cursor-wait ${
        tone === "danger" ? "text-red-500 hover:bg-red-500/10" : "text-foreground hover:bg-foreground/5"
      }`}
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.75} />
      ) : (
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      )}
      {label}
    </button>
  );
}
