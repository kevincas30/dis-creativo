import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import Sidebar from "@/components/sidebar/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const { user, workspace } = await requireWorkspaceMembership();
  const quotes = await prisma.quote.findMany({
    where: { workspaceId: workspace.id },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  const sidebarQuotes = quotes.map((quote) => ({
    id: quote.id,
    title: quote.client?.name ?? "Nuevo presupuesto",
    status: quote.status,
  }));

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        quotes={sidebarQuotes}
        user={{ displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }}
      />
      <main className="bg-black flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
