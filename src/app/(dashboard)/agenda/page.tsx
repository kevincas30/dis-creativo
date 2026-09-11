import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { serializeEvent } from "@/lib/event-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import AgendaPageClient from "@/components/dashboard/agenda/AgendaPageClient";
import { getProjectAgendaItems } from "@/lib/project-agenda-items";

export default async function AgendaComercialPage() {
  const { workspace } = await requireWorkspaceMembership();

  const [events, clients, projects, members, quotes, projectDateItems] = await Promise.all([
    prisma.event.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        startAt: true,
        endAt: true,
        allDay: true,
        location: true,
        notes: true,
        clientId: true,
        projectId: true,
        quoteId: true,
        periodId: true,
        responsibleId: true,
        responsible: { select: { id: true, displayName: true } },
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({ where: { workspaceId: workspace.id, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, select: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } }),
    prisma.quote.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { id: true, clientId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
    getProjectAgendaItems(prisma, workspace.id),
  ]);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-3 py-6 sm:px-10 sm:py-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col pb-4 lg:block lg:pb-12">
        <AgendaPageClient initialEvents={[...events.map(serializeEvent), ...projectDateItems]} clients={clients} projects={projects} members={members.map(({ user }) => ({ id: user.id, name: user.displayName }))} quotes={quotes.map((quote) => ({ ...quote, createdAt: quote.createdAt.toISOString() }))} />
      </div>
    </div>
  );
}
