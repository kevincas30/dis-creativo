"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Users,
  FolderKanban,
  ListChecks,
  FileText,
  CreditCard,
  UsersRound,
  BarChart3,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import UserMenu from "@/components/layout/UserMenu";

type SidebarUser = { displayName: string; email: string; avatarUrl: string | null };

const LIQUID_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(24, 24, 27, 0.25)",
  "--liquid-glass-border": "rgba(166, 217, 226, 0.18)",
  "--liquid-glass-glow": "transparent",
} as React.CSSProperties;

const ACTIVE_NAV_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(37, 99, 235, 0.22)",
  "--liquid-glass-border": "rgba(96, 165, 250, 0.5)",
  "--liquid-glass-border-hover": "rgba(96, 165, 250, 0.7)",
  "--liquid-glass-glow": "rgba(96, 165, 250, 0.25)",
} as React.CSSProperties;

type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  openInNewTab?: boolean;
};

// Sidebar del dashboard principal del estudio — independiente del sidebar
// interno de Presupuestos IA (src/components/sidebar/Sidebar.tsx). No
// comparte lista de presupuestos ni acciones de ese módulo; "Presupuestos IA"
// abre en una pestaña nueva para no perder el dashboard principal de vista.
const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/", icon: Home, isActive: (p) => p === "/" },
  { label: "Agenda comercial", href: "/agenda", icon: Calendar, isActive: (p) => p.startsWith("/agenda") },
  { label: "Clientes", href: "/clientes", icon: Users, isActive: (p) => p.startsWith("/clientes") },
  { label: "Proyectos", href: "/projects", icon: FolderKanban, isActive: (p) => p.startsWith("/projects") },
  { label: "Tareas", href: "/tasks", icon: ListChecks, isActive: (p) => p.startsWith("/tasks") },
  {
    label: "Presupuestos IA",
    href: "/presupuestos",
    icon: FileText,
    isActive: (p) => p.startsWith("/presupuestos"),
    openInNewTab: true,
  },
  { label: "Pagos", href: "/payments", icon: CreditCard, isActive: (p) => p.startsWith("/payments") },
  { label: "Equipo", href: "/team", icon: UsersRound, isActive: (p) => p.startsWith("/team") },
  { label: "Reportes", href: "/reports", icon: BarChart3, isActive: (p) => p.startsWith("/reports") },
];

export default function GlobalSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* En móvil el sidebar se superpone al contenido (no lo empuja) — este
          fondo permite cerrarlo tocando fuera. A partir de lg vuelve a ser
          parte del flujo normal, como en escritorio. */}
      {!isCollapsed ? (
        <div
          aria-hidden
          onClick={() => setIsCollapsed(true)}
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
        />
      ) : null}

      <aside
        role={isCollapsed ? "button" : undefined}
        tabIndex={isCollapsed ? 0 : undefined}
        onClick={isCollapsed ? () => setIsCollapsed(false) : undefined}
        onKeyDown={
          isCollapsed
            ? (event) => {
                if (event.key === "Enter" || event.key === " ") setIsCollapsed(false);
              }
            : undefined
        }
        aria-label={isCollapsed ? "Expandir sidebar" : undefined}
        className={`liquid-glass flex shrink-0 flex-col overflow-hidden ${
          isCollapsed
            ? "w-16 cursor-pointer"
            : "fixed inset-y-0 left-0 z-40 w-64 shadow-2xl lg:static lg:z-auto lg:shadow-none"
        }`}
        style={LIQUID_GLASS_VARS}
      >
      {isCollapsed ? (
        <div className="animate-fade-in flex w-16 flex-1 flex-col items-center gap-3 overflow-hidden py-4">
          <Image src="/logo.svg" alt="Diseño Creativo" width={36} height={36} className="rounded-full" />

          <nav className="flex w-full flex-1 flex-col items-center gap-1.5 overflow-y-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isActive(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  onClick={(event) => event.stopPropagation()}
                  aria-label={item.label}
                  title={item.label}
                  style={isActive ? ACTIVE_NAV_GLASS_VARS : undefined}
                  className={`focus-visible:ring-accent/40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.9] focus-visible:ring-2 focus-visible:outline-none ${
                    isActive ? "liquid-glass text-white" : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.75} />
                </Link>
              );
            })}
          </nav>

          <Avatar name={user.displayName} avatarUrl={user.avatarUrl} className="h-9 w-9 text-xs" />
        </div>
      ) : (
        <div className="animate-fade-in flex w-64 flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Link
              href="/"
              className="focus-visible:ring-accent/40 shadow-soft inline-block rounded-xl transition-transform duration-200 ease-out hover:scale-105 active:scale-95 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Image src="/logo.svg" alt="Diseño Creativo" width={36} height={36} className="rounded-full" />
            </Link>
            <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">Diseño Creativo</h1>
            <button
              type="button"
              onClick={() => setIsCollapsed(true)}
              aria-label="Contraer sidebar"
              className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors duration-150"
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.isActive(pathname);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  target={item.openInNewTab ? "_blank" : undefined}
                  rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                  style={isActive ? ACTIVE_NAV_GLASS_VARS : undefined}
                  className={`focus-visible:ring-accent/40 flex items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none ${
                    isActive
                      ? "liquid-glass text-white font-medium"
                      : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-surface-border border-t p-2">
            <UserMenu initialUser={user} />
          </div>
        </div>
      )}
      </aside>
    </>
  );
}
