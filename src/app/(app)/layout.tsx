import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import Sidebar from "@/components/sidebar/Sidebar";
import UserMenu from "@/components/layout/UserMenu";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  const quotes = await prisma.quote.findMany({
    where: { userId: user.id },
    include: { client: true },
    orderBy: { updatedAt: "desc" },
  });

  const sidebarQuotes = quotes.map((quote) => ({
    id: quote.id,
    title: quote.client?.name ? `Presupuesto ${quote.client.name}` : "Nuevo presupuesto",
    status: quote.status,
  }));

  return (
    <div className="flex h-screen flex-col">
      <header className="border-surface-border bg-surface sticky top-0 z-10 flex shrink-0 items-center justify-between border-b px-6 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="focus-visible:ring-accent/40 shadow-soft inline-block rounded-xl transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Image src="/logo.svg" alt="Diseño Creativo" width={36} height={36} className="rounded-xl" />
          </Link>
          <div>
            <h1 className="text-sm leading-tight font-semibold tracking-tight">Diseño Creativo</h1>
            <p className="text-muted-foreground text-xs leading-tight">Generador Inteligente de Presupuestos</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu initialUser={{ displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }} />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar quotes={sidebarQuotes} />
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
