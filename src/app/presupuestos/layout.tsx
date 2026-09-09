import type { ReactNode } from "react";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import DashboardChrome from "@/components/dashboard/DashboardChrome";

/** Presupuestos comparte el shell operativo; ya no monta el sidebar legado. */
export default async function QuoteLayout({ children }: { children: ReactNode }) {
  const { user } = await requireWorkspaceMembership();
  return <div className="flex h-screen flex-col overflow-hidden md:flex-row"><DashboardChrome user={{ displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }}>{children}</DashboardChrome></div>;
}
