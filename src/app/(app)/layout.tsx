import type { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import Sidebar from "@/components/sidebar/Sidebar";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const quotes = await prisma.quote.findMany({
    where: { userId: user.id },
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
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
