"use client";

import type { ReactNode } from "react";
import GlobalSidebar, { type SidebarUser } from "@/components/dashboard/GlobalSidebar";
import { MobileHeaderActionProvider } from "@/components/dashboard/MobileHeaderActionContext";

// Envoltorio cliente del layout del dashboard: provee el contexto de la
// acción contextual de la barra superior móvil (p. ej. el "+" de Proyectos o
// Agenda) para que tanto GlobalSidebar (que renderiza la barra) como
// `children` (la página activa, que la registra) compartan el mismo árbol.
export default function DashboardChrome({ user, children }: { user: SidebarUser; children: ReactNode }) {
  return (
    <MobileHeaderActionProvider>
      <GlobalSidebar user={user} />
      <main className="bg-black flex-1 overflow-hidden">{children}</main>
    </MobileHeaderActionProvider>
  );
}
