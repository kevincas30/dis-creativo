import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { buildClientCards } from "@/lib/client-relations";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ClientesPageClient from "@/components/dashboard/clientes/ClientesPageClient";

type ClientView = "prospects" | "clients" | "archived";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const requested = (await searchParams).view;
  const view: ClientView = requested === "prospects" || requested === "archived" ? requested : "clients";
  const { workspace } = await requireWorkspaceMembership();
  const archived = view === "archived";
  const [clients, projects, quotes, events, activity, members] = await Promise.all([
    prisma.client.findMany({
      where: { workspaceId: workspace.id, archivedAt: archived ? { not: null } : null },
      include: { responsible: { select: { id: true, displayName: true } }, nextFollowUpEvent: { select: { id: true, title: true, startAt: true, endAt: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.project.findMany({ where: { workspaceId: workspace.id }, select: { client: true, clientId: true, updatedAt: true } }),
    prisma.quote.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { clientId: true, updatedAt: true } }),
    prisma.event.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { clientId: true, startAt: true } }),
    prisma.activityRecord.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { clientId: true, createdAt: true } }),
    prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } }),
  ]);
  const clientCards = buildClientCards(clients, projects, quotes, events, activity);
  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 lg:px-16">
      <DashboardBackground />
      <div className="mx-auto w-full max-w-6xl flex-1 pb-12">
        <ClientesPageClient view={view} clients={clientCards} members={members.map((member) => ({ id: member.user.id, name: member.user.displayName }))} />
      </div>
    </div>
  );
}
