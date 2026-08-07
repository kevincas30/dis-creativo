import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeClient } from "@/lib/client-presenter";
import { serializeProject } from "@/lib/project-presenter";
import { serializeEvent } from "@/lib/event-presenter";
import { projectMatchesClient } from "@/lib/client-project-match";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ClientDetailClient from "@/components/dashboard/clientes/ClientDetailClient";
import type { ClientSummary } from "@/components/dashboard/clientes/ClientSummaryTiles";
import type { ClientActivityItem } from "@/components/dashboard/clientes/tabs/ClientActivityTab";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    notFound();
  }

  const [quotes, events, userProjects, allClients] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: user.id, clientId: id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, total: true, currency: true, issuedAt: true, updatedAt: true },
    }),
    prisma.event.findMany({
      where: { userId: user.id, clientId: id },
      orderBy: { startAt: "desc" },
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
    prisma.project.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const serializedClient = serializeClient(client);
  const matchedProjects = userProjects.filter((project) => projectMatchesClient(project.client, serializedClient)).map(serializeProject);
  const serializedEvents = events.map(serializeEvent);
  const quoteRows = quotes.map((quote) => ({
    id: quote.id,
    status: quote.status,
    total: Number(quote.total),
    currency: quote.currency,
    issuedAt: quote.issuedAt.toISOString(),
  }));

  const summary: ClientSummary = {
    activeProjects: matchedProjects.filter((project) => project.status !== "DONE").length,
    sentQuotes: quoteRows.length,
    registeredMeetings: serializedEvents.filter((event) => event.type === "MEETING").length,
    pendingPayments: null,
  };

  const activity: ClientActivityItem[] = [
    ...quoteRows.map((quote) => ({
      id: `quote-${quote.id}`,
      type: "quote" as const,
      label: "Presupuesto actualizado",
      subject: new Intl.NumberFormat("es-MX", { style: "currency", currency: quote.currency ?? "MXN" }).format(quote.total),
      when: quote.issuedAt,
    })),
    ...matchedProjects.map((project) => ({
      id: `project-${project.id}`,
      type: "project" as const,
      label: "Proyecto actualizado",
      subject: project.name,
      when: project.updatedAt,
    })),
    ...serializedEvents.map((event) => ({
      id: `event-${event.id}`,
      type: "event" as const,
      label: "Evento agendado",
      subject: event.title,
      when: event.startAt,
    })),
  ]
    .sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime())
    .slice(0, 12);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-5xl pb-12">
        <ClientDetailClient
          client={serializedClient}
          summary={summary}
          projects={matchedProjects}
          quotes={quoteRows}
          events={serializedEvents}
          activity={activity}
          allClients={allClients}
          allProjects={userProjects.map((project) => ({ id: project.id, name: project.name }))}
        />
      </div>
    </div>
  );
}
