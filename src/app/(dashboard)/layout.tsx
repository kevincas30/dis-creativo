import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/current-user";
import GlobalSidebar from "@/components/dashboard/GlobalSidebar";

// Layout del dashboard principal del estudio — independiente del layout de
// Presupuestos IA (src/app/presupuestos/layout.tsx). No obtiene la lista de
// presupuestos ni monta el sidebar de ese módulo.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <GlobalSidebar user={{ displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }} />
      <main className="bg-black flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
