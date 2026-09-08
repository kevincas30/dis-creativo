import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import WorkList from "@/components/dashboard/WorkList";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
export default async function TasksPage({ searchParams }: { searchParams: Promise<{ completed?: string }> }) {
  const { workspace } = await requireWorkspaceMembership();
  const completed = (await searchParams).completed === "1";
  const items = await prisma.workItem.findMany({ where: { workspaceId: workspace.id, kind: "TASK", completedAt: completed ? { not: null } : null }, include: { project: { select: { name: true } }, period: { select: { label: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] });
  return <div className="relative h-full overflow-y-auto px-6 py-10 sm:px-10 lg:px-16"><DashboardBackground /><div className="mx-auto max-w-5xl space-y-5"><h1 className="text-2xl font-semibold">Tareas</h1><p className="text-sm text-muted-foreground">Trabajo concreto de tus proyectos y periodos. Añade tareas desde la ficha de cada proyecto.</p><Link href={completed ? "/tasks" : "/tasks?completed=1"} className="inline-block text-sm underline">{completed ? "Ver pendientes" : "Ver completadas"}</Link><section className="liquid-glass rounded-2xl p-5"><WorkList items={items.map((w) => ({ ...w, dueDate: w.dueDate?.toISOString() ?? null, completedAt: w.completedAt?.toISOString() ?? null }))} /></section></div></div>;
}
