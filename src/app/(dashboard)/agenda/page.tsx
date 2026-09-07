import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeEvent } from "@/lib/event-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import AgendaPageClient from "@/components/dashboard/agenda/AgendaPageClient";

export default async function AgendaComercialPage() {
  const user = await getCurrentUser();

  const [events, clients, projects] = await Promise.all([
    prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        type: true,
        startAt: true,
        endAt: true,
        location: true,
        notes: true,
        clientId: true,
        projectId: true,
        client: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
      },
    }),
    prisma.client.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.project.findMany({ where: { userId: user.id }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-3 py-6 sm:px-10 sm:py-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto flex w-full max-w-6xl min-h-0 flex-1 flex-col pb-4 lg:block lg:pb-12">
        <AgendaPageClient initialEvents={events.map(serializeEvent)} clients={clients} projects={projects} />
      </div>
    </div>
  );
}
