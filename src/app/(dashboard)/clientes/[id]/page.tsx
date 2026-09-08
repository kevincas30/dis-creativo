import Link from "next/link";
import ArchiveClientButton from "@/components/dashboard/clientes/ArchiveClientButton";
import PaymentAccounts from "@/components/dashboard/PaymentAccounts";
import WorkList from "@/components/dashboard/WorkList";
import { getPaymentAccounts } from "@/lib/payment-accounts";
import { financialSummary } from "@/lib/work-finance";
import { toDateInputValue } from "@/lib/dashboard-agenda-dates";
import { isActiveProject } from "@/lib/project-status";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
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
  const context = await requireWorkspaceMembership();
  const { workspace } = context;

  const client = await prisma.client.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!client) {
    notFound();
  }

  const [quotes, events, userProjects, allClients] = await Promise.all([
    prisma.quote.findMany({
      where: { workspaceId: workspace.id, clientId: id },
      orderBy: { updatedAt: "desc" },
      select: { id: true, status: true, total: true, currency: true, issuedAt: true, updatedAt: true },
    }),
    prisma.event.findMany({
      where: { workspaceId: workspace.id, clientId: id },
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
    prisma.project.findMany({ where: { workspaceId: workspace.id }, orderBy: { updatedAt: "desc" } }),
    prisma.client.findMany({ where: { workspaceId: workspace.id, archivedAt: null }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  const serializedClient = serializeClient(client);
  const matchedProjects = userProjects.filter((project) => project.clientId === id).map(serializeProject);
  const serializedEvents = events.map(serializeEvent);
  const quoteRows = quotes.map((quote) => ({
    id: quote.id,
    status: quote.status,
    total: Number(quote.total),
    currency: quote.currency,
    issuedAt: quote.issuedAt.toISOString(),
  }));

  const [accounts, records, workItems, periods] = await Promise.all([
    getPaymentAccounts(workspace.id, id),
    prisma.activityRecord.findMany({ where: { workspaceId: workspace.id, clientId: id }, include: { actor: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 30 }),
    prisma.workItem.findMany({ where: { workspaceId: workspace.id, project: { clientId: id }, completedAt: null }, include: { project: { select: { name: true } }, period: { select: { label: true } } }, orderBy: { dueDate: "asc" } }),
    prisma.projectPeriod.findMany({ where: { project: { workspaceId: workspace.id, clientId: id } }, include: { project: { select: { name: true } } }, orderBy: { startDate: "desc" } }),
  ]);
  const legacyProjects = userProjects.filter((p) => !p.clientId && projectMatchesClient(p.client, serializedClient));
  const summary: ClientSummary = {
    activeProjects: matchedProjects.filter(isActiveProject).length,
    sentQuotes: quoteRows.filter((quote) => !["DRAFT", "ARCHIVED"].includes(quote.status)).length,
    registeredMeetings: serializedEvents.filter((event) => event.type === "MEETING").length,
    pendingPayments: accounts.filter((account) => account.total !== null && financialSummary(account.total, account.payments.map((payment) => payment.amount), account.dueDate, toDateInputValue(new Date())).status !== "Pagado").length,
  };

  const activity: ClientActivityItem[] = records.map((record) => ({ id: record.id, type: "project", label: record.description, subject: record.actor.displayName, when: record.createdAt.toISOString() }));

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-5xl pb-12">
        <ClientDetailClient
          key={client.updatedAt.toISOString()}
          client={serializedClient}
          paymentsContent={<PaymentAccounts accounts={accounts} />}
          summary={summary}
          projects={matchedProjects}
          quotes={quoteRows}
          events={serializedEvents}
          activity={activity}
          allClients={allClients}
          allProjects={userProjects.map((project) => ({ id: project.id, name: project.name }))}
        />
        {context.membership.role === "ADMIN" && <ArchiveClientButton id={id} archived={!!client.archivedAt} />}
        <section className="mt-6 space-y-4 liquid-glass rounded-2xl p-5"><h2 className="font-semibold">Periodos y trabajo pendiente</h2>
          {periods.map((p) => <Link className="block text-sm underline" key={p.id} href={`/projects/${p.projectId}?period=${p.id}`}>{p.project.name} · {p.label}</Link>)}
          <WorkList items={workItems.map((w) => ({ ...w, dueDate: w.dueDate?.toISOString() ?? null, completedAt: w.completedAt?.toISOString() ?? null }))} />
        </section>
        {!!legacyProjects.length && <section className="mt-6 text-sm space-y-2"><h2 className="font-medium">Coincidencias antiguas por nombre · vínculo sin confirmar</h2><p className="text-muted-foreground">Confirma el cliente desde cada proyecto para incorporar su trabajo y pagos a esta ficha.</p>{legacyProjects.map((p) => <Link className="block underline" key={p.id} href={`/projects/${p.id}`}>{p.name}</Link>)}</section>}
      </div>
    </div>
  );
}
