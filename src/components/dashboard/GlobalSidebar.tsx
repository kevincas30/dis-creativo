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
  MoreHorizontal,
  PanelLeftClose,
  type LucideIcon,
} from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import UserMenu from "@/components/layout/UserMenu";
import MobileTopBar from "@/components/dashboard/MobileTopBar";
import MobileDrawer from "@/components/dashboard/MobileDrawer";

export type SidebarUser = { displayName: string; email: string; avatarUrl: string | null };

export const LIQUID_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(24, 24, 27, 0.25)",
  "--liquid-glass-border": "rgba(166, 217, 226, 0.18)",
  "--liquid-glass-glow": "transparent",
} as React.CSSProperties;

export const ACTIVE_NAV_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(37, 99, 235, 0.22)",
  "--liquid-glass-border": "rgba(96, 165, 250, 0.5)",
  "--liquid-glass-border-hover": "rgba(96, 165, 250, 0.7)",
  "--liquid-glass-glow": "rgba(96, 165, 250, 0.25)",
} as React.CSSProperties;

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
  openInNewTab?: boolean;
};

// Sidebar del dashboard principal del estudio — independiente del sidebar
// interno de Presupuestos IA (src/components/sidebar/Sidebar.tsx). No
// comparte lista de presupuestos ni acciones de ese módulo.
export const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/", icon: Home, isActive: (p) => p === "/" },
  { label: "Clientes", href: "/clientes", icon: Users, isActive: (p) => p.startsWith("/clientes") },
  { label: "Proyectos", href: "/projects", icon: FolderKanban, isActive: (p) => p.startsWith("/projects") },
  { label: "Tareas", href: "/tasks", icon: ListChecks, isActive: (p) => p.startsWith("/tasks") },
  {
    label: "Presupuestos",
    href: "/presupuestos",
    icon: FileText,
    isActive: (p) => p.startsWith("/presupuestos"),
  },
];

export const SECONDARY_NAV_ITEMS: NavItem[] = [
  { label: "Agenda comercial", href: "/agenda", icon: Calendar, isActive: (p) => p.startsWith("/agenda") },
  { label: "Pagos", href: "/payments", icon: CreditCard, isActive: (p) => p.startsWith("/payments") },
];

export function MoreNavigation({ pathname, onNavigate, defaultOpen = false }: { pathname: string; onNavigate?: () => void; defaultOpen?: boolean }) {
  return (
    <details key={pathname} open={defaultOpen || SECONDARY_NAV_ITEMS.some((item) => item.isActive(pathname))} className="group mt-4 border-t border-surface-border pt-3">
      <summary className="text-muted-foreground hover:text-foreground cursor-pointer rounded-xl px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
        Más
      </summary>
      <div className="mt-1 space-y-1">
        {SECONDARY_NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={item.isActive(pathname) ? "page" : undefined}
            style={item.isActive(pathname) ? ACTIVE_NAV_GLASS_VARS : undefined}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${item.isActive(pathname) ? "liquid-glass text-white font-medium" : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}>
            <item.icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {item.label}
          </Link>
        ))}
      </div>
    </details>
  );
}

export default function GlobalSidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop / tablet (md y superior): sidebar fijo, sin cambios. En
          móvil no se renderiza en absoluto — esa navegación vive en
          MobileTopBar + MobileDrawer. */}
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
        className={`liquid-glass hidden shrink-0 flex-col overflow-hidden md:flex ${isCollapsed ? "w-16 cursor-pointer" : "w-64"}`}
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
                    aria-current={isActive ? "page" : undefined}
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
              <button type="button" aria-label="Más acciones" title="Más" onClick={(event) => { event.stopPropagation(); setShowMore(true); setIsCollapsed(false); }}
                className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-10 w-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                <MoreHorizontal className="h-5 w-5" />
              </button>
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
                    aria-current={isActive ? "page" : undefined}
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
              <MoreNavigation pathname={pathname} defaultOpen={showMore} />
            </nav>

            <div className="border-surface-border border-t p-2">
              <UserMenu initialUser={user} />
            </div>
          </div>
        )}
      </aside>

      {/* Móvil (< md): barra superior + menú deslizante, en vez del sidebar. */}
      <MobileTopBar onMenuClick={() => setIsMobileMenuOpen(true)} />
      <MobileDrawer isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} user={user} />
    </>
  );
}
