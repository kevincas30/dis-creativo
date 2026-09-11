"use client";

import { useEffect, useRef } from "react";
import { CalendarDays, Check, Edit3, ExternalLink, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export type AgendaContextTarget = { x: number; y: number; date: string; item: AgendaItemSnapshot | null };

function MenuButton({ icon: Icon, children, danger = false, onClick }: { icon: typeof Plus; children: React.ReactNode; danger?: boolean; onClick: () => void }) {
  return <button type="button" role="menuitem" onClick={onClick} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-foreground/5 focus-visible:bg-foreground/5 focus-visible:outline-none ${danger ? "text-red-400 hover:bg-red-500/10" : ""}`}><Icon className="h-4 w-4" />{children}</button>;
}

export default function AgendaContextMenu({ target, onClose, onCreate, onOpen, onEdit, onTaskStatus, onDelete }: { target: AgendaContextTarget | null; onClose: () => void; onCreate: (type: "TASK" | "MEETING" | "FOLLOW_UP" | "EVENT", date: string) => void; onOpen: (item: AgendaItemSnapshot) => void; onEdit: (item: AgendaItemSnapshot) => void; onTaskStatus: (item: AgendaItemSnapshot) => void; onDelete: (item: AgendaItemSnapshot) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (!target) return; const close = (event: MouseEvent) => { if (!ref.current?.contains(event.target as Node)) onClose(); }; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); }; window.addEventListener("mousedown", close); window.addEventListener("keydown", escape); queueMicrotask(() => ref.current?.querySelector<HTMLButtonElement>("button")?.focus()); return () => { window.removeEventListener("mousedown", close); window.removeEventListener("keydown", escape); }; }, [target, onClose]);
  if (!target) return null;
  const item = target.item;
  const left = Math.min(target.x, window.innerWidth - 232); const top = Math.min(target.y, window.innerHeight - 260);
  return <div ref={ref} role="menu" aria-label="Acciones de agenda" className="bg-surface-solid border-surface-border fixed z-[80] w-56 rounded-xl border p-1 shadow-elevated" style={{ left: Math.max(8, left), top: Math.max(8, top) }}>
    {!item ? <>
      <MenuButton icon={Plus} onClick={() => onCreate("TASK", target.date)}>Nueva tarea</MenuButton>
      <MenuButton icon={CalendarDays} onClick={() => onCreate("MEETING", target.date)}>Nueva reunión</MenuButton>
      <MenuButton icon={Check} onClick={() => onCreate("FOLLOW_UP", target.date)}>Nuevo seguimiento</MenuButton>
      <MenuButton icon={MoreHorizontal} onClick={() => onCreate("EVENT", target.date)}>Otro evento</MenuButton>
    </> : item.taskId ? <>
      <MenuButton icon={ExternalLink} onClick={() => onOpen(item)}>Abrir</MenuButton>
      <MenuButton icon={Edit3} onClick={() => onEdit(item)}>Editar</MenuButton>
      <MenuButton icon={Check} onClick={() => onTaskStatus(item)}>{item.taskStatus === "COMPLETED" ? "Reabrir" : item.taskNeedsReview ? "Enviar a revisión" : "Marcar como completada"}</MenuButton>
      <MenuButton icon={CalendarDays} onClick={() => onEdit(item)}>Reprogramar</MenuButton>
      <MenuButton icon={Trash2} danger onClick={() => onDelete(item)}>Eliminar</MenuButton>
    </> : item.agendaKind === "PROJECT_START" || item.agendaKind === "PROJECT_DUE" ? <>
      <MenuButton icon={ExternalLink} onClick={() => onOpen(item)}>Abrir proyecto</MenuButton>
      <MenuButton icon={Edit3} onClick={() => onEdit(item)}>Cambiar fecha</MenuButton>
    </> : <>
      <MenuButton icon={ExternalLink} onClick={() => onOpen(item)}>{item.type === "FOLLOW_UP" ? "Abrir cliente o presupuesto" : "Abrir"}</MenuButton>
      <MenuButton icon={Edit3} onClick={() => onEdit(item)}>Editar</MenuButton>
      <MenuButton icon={CalendarDays} onClick={() => onEdit(item)}>Reprogramar</MenuButton>
      <MenuButton icon={Trash2} danger onClick={() => onDelete(item)}>{item.type === "FOLLOW_UP" ? "Eliminar seguimiento" : "Eliminar"}</MenuButton>
    </>}
  </div>;
}
