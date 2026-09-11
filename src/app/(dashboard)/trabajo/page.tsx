import DashboardBackground from "@/components/dashboard/DashboardBackground";
import WorkPageClient from "@/components/dashboard/trabajo/WorkPageClient";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";

export default async function WorkPage({ searchParams }: { searchParams: Promise<{ task?: string; new?: string; dueDate?: string }> }) {
  const { user, workspace, membership } = await requireWorkspaceMembership();
  const [tasks, projects, members] = await Promise.all([
    prisma.workItem.findMany({ where: { workspaceId: workspace.id, kind: { in: ["TASK", "DELIVERABLE"] }, archivedAt: null }, include: { project: { select: { id: true, name: true, kind: true } }, period: { select: { id: true, label: true } }, responsible: { select: { id: true, displayName: true } }, createdBy: { select: { id: true, displayName: true } }, comments: { include: { author: { select: { id: true, displayName: true } } }, orderBy: { createdAt: "asc" } }, activityRecords: { include: { actor: { select: { displayName: true } } }, orderBy: { createdAt: "asc" } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "asc" }] }),
    prisma.project.findMany({ where: { workspaceId: workspace.id, archivedAt: null }, select: { id: true, name: true, kind: true, periods: { select: { id: true, label: true }, orderBy: { startDate: "desc" } } }, orderBy: { name: "asc" } }),
    prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, select: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } }),
  ]);
  const { task, new: create, dueDate } = await searchParams;
  return <div className="relative flex h-full flex-col overflow-y-auto px-4 py-6 sm:px-10 lg:px-16"><DashboardBackground /><div className="mx-auto w-full max-w-6xl pb-12"><WorkPageClient initialTaskId={task ?? null} initialCreate={create === "1"} initialDueDate={dueDate ?? null} currentUserId={user.id} role={membership.role} members={members.map(({ user: member }) => ({ id: member.id, name: member.displayName }))} projects={projects.map(project => ({ ...project }))} tasks={tasks.map(task => ({ ...task, startDate: task.startDate?.toISOString() ?? null, dueDate: task.dueDate?.toISOString() ?? null, completedAt: task.completedAt?.toISOString() ?? null, createdAt: task.createdAt.toISOString(), comments: task.comments.map(comment => ({ ...comment, createdAt: comment.createdAt.toISOString(), updatedAt: comment.updatedAt.toISOString() })), activityRecords: task.activityRecords.map(record => ({ ...record, createdAt: record.createdAt.toISOString() })) }))} /></div></div>;
}
