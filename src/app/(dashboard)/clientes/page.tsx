import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { buildClientCards } from "@/lib/client-relations";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ClientesPageClient from "@/components/dashboard/clientes/ClientesPageClient";

export default async function ClientesPage() {
  const user = await getCurrentUser();

  const [clients, projects, quotes, events] = await Promise.all([
    prisma.client.findMany({ orderBy: { name: "asc" } }),
    prisma.project.findMany({ where: { userId: user.id }, select: { client: true, updatedAt: true } }),
    prisma.quote.findMany({ where: { userId: user.id, clientId: { not: null } }, select: { clientId: true, updatedAt: true } }),
    prisma.event.findMany({ where: { userId: user.id, clientId: { not: null } }, select: { clientId: true, startAt: true } }),
  ]);

  const clientCards = buildClientCards(clients, projects, quotes, events);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-6xl flex-1 pb-12">
        <ClientesPageClient clients={clientCards} />
      </div>
    </div>
  );
}
