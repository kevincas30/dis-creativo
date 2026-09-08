import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { buildClientCards } from "@/lib/client-relations";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ClientesPageClient from "@/components/dashboard/clientes/ClientesPageClient";

export default async function ClientesPage({ searchParams }: { searchParams: Promise<{ archived?: string }> }) {
  const archived = (await searchParams).archived === "1";
  const { workspace } = await requireWorkspaceMembership();

  const [clients, projects, quotes, events] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: workspace.id, archivedAt: archived ? { not: null } : null }, orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { workspaceId: workspace.id }, select: { client: true, clientId: true, updatedAt: true } }),
    prisma.quote.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { clientId: true, updatedAt: true } }),
    prisma.event.findMany({ where: { workspaceId: workspace.id, clientId: { not: null } }, select: { clientId: true, startAt: true } }),
  ]);

  const clientCards = buildClientCards(clients, projects, quotes, events);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-6xl flex-1 pb-12">
        <Link href={archived ? "/clientes" : "/clientes?archived=1"} className="mb-5 inline-block text-sm underline">{archived ? "Volver a clientes · Mostrando archivados" : "Ver clientes archivados"}</Link>
        <ClientesPageClient clients={clientCards} />
      </div>
    </div>
  );
}
