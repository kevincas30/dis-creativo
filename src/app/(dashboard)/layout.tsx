import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/current-user";
import DashboardChrome from "@/components/dashboard/DashboardChrome";

// Layout del dashboard principal del estudio — independiente del layout de
// Presupuestos IA (src/app/presupuestos/layout.tsx). No obtiene la lista de
// presupuestos ni monta el sidebar de ese módulo.
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex h-screen flex-col overflow-hidden md:flex-row">
      <DashboardChrome user={{ displayName: user.displayName, email: user.email, avatarUrl: user.avatarUrl }}>
        {children}
      </DashboardChrome>
    </div>
  );
}
