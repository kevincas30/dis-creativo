import { prisma } from "@/lib/prisma";
import { serializeProject } from "@/lib/project-presenter";

export async function getWorkView(projectId: string, workspaceId: string) {
  const project = await prisma.project.findFirstOrThrow({ where: { id: projectId, workspaceId }, include: {
    clientRecord: { select: { id: true, name: true, archivedAt: true } },
    periods: { orderBy: { startDate: "desc" } },
    payments: { orderBy: { paidAt: "desc" } },
    workItems: { orderBy: { createdAt: "asc" } },
    assignments: { include: { user: { select: { displayName: true } } } },
    events: { orderBy: { startAt: "asc" } },
    activityRecords: { orderBy: { createdAt: "desc" }, take: 100, include: { actor: { select: { displayName: true } } } },
  } });
  const [clients, quotes, users] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({ where: { workspaceId, clientId: { not: null } }, select: { id: true, clientId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    prisma.workspaceMember.findMany({ where: { workspaceId }, select: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } }),
  ]);
  return {
    project: { ...serializeProject(project), agreedTotal: project.agreedTotal?.toFixed(2) ?? null, currency: project.currency, paymentDueDate: project.paymentDueDate?.toISOString() ?? null },
    client: project.clientRecord ? { id: project.clientRecord.id, name: project.clientRecord.name, archived: Boolean(project.clientRecord.archivedAt) } : null,
    periods: project.periods.map((p) => ({ id: p.id, label: p.label, status: p.status, startDate: p.startDate.toISOString(), dueDate: p.dueDate?.toISOString() ?? null, agreedTotal: p.agreedTotal?.toFixed(2) ?? null, currency: p.currency, paymentDueDate: p.paymentDueDate?.toISOString() ?? null })),
    payments: project.payments.map((p) => ({ id: p.id, periodId: p.periodId, amount: p.amount.toFixed(2), currency: p.currency, paidAt: p.paidAt.toISOString(), note: p.note })),
    workItems: project.workItems.map((w) => ({ ...w, createdAt: w.createdAt.toISOString(), completedAt: w.completedAt?.toISOString() ?? null, dueDate: w.dueDate?.toISOString() ?? null })),
    assignments: project.assignments.map((a) => ({ id: a.id, periodId: a.periodId, userId: a.userId, name: a.user.displayName })),
    events: project.events.map((e) => ({ id: e.id, periodId: e.periodId, title: e.title, startAt: e.startAt.toISOString() })),
    activity: project.activityRecords.map((a) => ({ id: a.id, periodId: a.periodId, description: a.description, at: a.createdAt.toISOString(), actor: a.actor.displayName })),
    clients, quotes: quotes.map((q) => ({ ...q, createdAt: q.createdAt.toISOString() })), users: users.map(({ user }) => user),
  };
}
export type WorkView = Awaited<ReturnType<typeof getWorkView>>;
