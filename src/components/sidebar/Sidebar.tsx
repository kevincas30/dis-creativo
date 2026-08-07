"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FileText, PanelLeftClose, Calendar } from "lucide-react";
import { createDraftQuote } from "@/app/(app)/quotes/actions";
import Button from "@/components/ui/Button";
import IconButton from "@/components/ui/IconButton";
import Avatar from "@/components/ui/Avatar";
import StatusDot from "@/components/sidebar/StatusDot";
import QuoteActionsMenu from "@/components/sidebar/QuoteActionsMenu";
import UserMenu from "@/components/layout/UserMenu";
import type { QuoteStatus } from "@/generated/prisma/enums";

type SidebarQuote = { id: string; title: string; status: QuoteStatus };
type SidebarUser = { displayName: string; email: string; avatarUrl: string | null };

const LIQUID_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(24, 24, 27, 0.25)",
  "--liquid-glass-border": "rgba(166, 217, 226, 0.18)",
  "--liquid-glass-glow": "transparent",
} as React.CSSProperties;

// "Nuevo presupuesto" — tinte con el color de acento para que destaque un
// poco más que el resto de botones glass del sidebar.
const NEW_QUOTE_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(49, 118, 137, 0.2)",
  "--liquid-glass-border": "rgba(61, 143, 166, 0.45)",
  "--liquid-glass-border-hover": "rgba(61, 143, 166, 0.65)",
  "--liquid-glass-glow": "rgba(61, 143, 166, 0.2)",
} as React.CSSProperties;

// "Agenda" — mismo tinte sutil que ya usa su tarjeta gemela en el inicio.
const AGENDA_GLASS_VARS = {
  "--liquid-glass-border": "rgba(166, 217, 226, 0.18)",
} as React.CSSProperties;

// Presupuesto activo en la lista — mismo azul que ya se usa para resaltar
// selección en el resto del sidebar, pero en versión glass (antes era un
// relleno sólido, el único elemento no-glass de la barra).
const ACTIVE_QUOTE_GLASS_VARS = {
  "--liquid-glass-bg": "rgba(37, 99, 235, 0.22)",
  "--liquid-glass-border": "rgba(96, 165, 250, 0.5)",
  "--liquid-glass-border-hover": "rgba(96, 165, 250, 0.7)",
  "--liquid-glass-glow": "rgba(96, 165, 250, 0.25)",
} as React.CSSProperties;

function stopPropagation(event: MouseEvent) {
  event.stopPropagation();
}

export default function Sidebar({ quotes, user }: { quotes: SidebarQuote[]; user: SidebarUser }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
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
      className={`liquid-glass flex shrink-0 flex-col overflow-hidden ${isCollapsed ? "w-16 cursor-pointer" : "w-64"}`}
      style={LIQUID_GLASS_VARS}
    >
      {isCollapsed ? (
        <div className="animate-fade-in flex w-16 flex-1 flex-col items-center gap-3 overflow-hidden py-4">
          <Image src="/logo.svg" alt="Diseño Creativo" width={36} height={36} className="rounded-full" />

          <form action={createDraftQuote} onClick={stopPropagation}>
            <IconButton type="submit" variant="glass" aria-label="Nuevo presupuesto" style={NEW_QUOTE_GLASS_VARS}>
              <Plus className="h-4 w-4" strokeWidth={2} />
            </IconButton>
          </form>

          <Link
            href="/agenda"
            onClick={stopPropagation}
            aria-label="Agenda"
            className="liquid-glass focus-visible:ring-accent/40 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.9] focus-visible:ring-2 focus-visible:outline-none"
            style={AGENDA_GLASS_VARS}
          >
            <Calendar className="h-4 w-4" strokeWidth={1.75} />
          </Link>

          <div className="flex-1" />

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

          <div className="space-y-2 p-3">
            <form action={createDraftQuote}>
              <Button type="submit" variant="glass" className="w-full font-semibold" style={NEW_QUOTE_GLASS_VARS}>
                <Plus className="h-4 w-4" strokeWidth={2} />
                Nuevo presupuesto
              </Button>
            </form>
            <Link
              href="/agenda"
              className="liquid-glass focus-visible:ring-accent/40 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97] focus-visible:ring-2 focus-visible:outline-none"
              style={AGENDA_GLASS_VARS}
            >
              <Calendar className="h-4 w-4" strokeWidth={1.75} />
              Agenda
            </Link>
          </div>

          <p className="text-muted-foreground px-5 pt-1 pb-2 text-xs font-medium tracking-wide uppercase">
            Mis presupuestos
          </p>

          <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
            {quotes.length === 0 ? (
              <p className="text-muted-foreground px-3 py-4 text-xs">Todavía no hay presupuestos.</p>
            ) : (
              quotes.map((quote, index) => {
                const href = `/quotes/${quote.id}`;
                const isActive = pathname === href;
                return (
                  <div
                    key={quote.id}
                    className="group animate-fade-in-up relative"
                    style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                  >
                    <Link
                      href={href}
                      style={isActive ? ACTIVE_QUOTE_GLASS_VARS : undefined}
                      className={`focus-visible:ring-accent/40 flex items-center gap-2 truncate rounded-xl border py-2 pr-8 pl-3 text-sm transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none ${
                        isActive
                          ? "liquid-glass text-white font-medium"
                          : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                      }`}
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                      <StatusDot status={quote.status} />
                      <span className="truncate">{quote.title}</span>
                    </Link>
                    <QuoteActionsMenu
                      quoteId={quote.id}
                      isActive={isActive}
                      className={`absolute top-1/2 right-1.5 -translate-y-1/2 transition-opacity duration-150 ${
                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                      }`}
                    />
                  </div>
                );
              })
            )}
          </nav>

          <div className="border-surface-border border-t p-2">
            <UserMenu initialUser={user} />
          </div>
        </div>
      )}
    </aside>
  );
}
