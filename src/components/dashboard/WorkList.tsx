"use client";
import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { workAction } from "@/app/(dashboard)/projects/work-actions";
export type WorkRow = { id: string; projectId: string; periodId: string | null; title: string; completedAt: string | null; dueDate: string | null; priority: string; project: { name: string }; period: { label: string } | null };
export default function WorkList({ items }: { items: WorkRow[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  return <div>{error && <p role="alert" className="text-red-400 text-sm">{error}</p>}{!items.length && <p className="py-4 text-sm text-muted-foreground">No hay tareas pendientes para esta vista.</p>}<ul className="divide-y divide-surface-border">{items.map((item) => <li key={item.id} className="flex gap-3 py-3 text-sm"><input type="checkbox" className="mt-1 self-start" disabled={pending} checked={!!item.completedAt} aria-label={`Completar ${item.title}`} onChange={(e) => { const f = new FormData(); f.set("command", "toggleWork"); f.set("itemId", item.id); f.set("completed", String(e.target.checked)); if (item.periodId) f.set("periodId", item.periodId); start(async () => { const result = await workAction(item.projectId, f); setError(result.error); router.refresh(); }); }} /><Link href={`/projects/${item.projectId}${item.periodId ? `?period=${item.periodId}` : ""}`}><p className={item.completedAt ? "line-through" : ""}>{item.title}</p><p className="text-xs text-muted-foreground">{item.project.name}{item.period && ` · ${item.period.label}`}{item.dueDate && ` · ${item.dueDate.slice(0, 10)}`}{item.priority === "HIGH" && " · Prioridad alta"}</p></Link></li>)}</ul></div>;
}
