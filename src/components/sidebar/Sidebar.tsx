"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { createDraftQuote } from "@/app/(app)/quotes/actions";
import Button from "@/components/ui/Button";
import StatusDot from "@/components/sidebar/StatusDot";
import QuoteActionsMenu from "@/components/sidebar/QuoteActionsMenu";
import UserMenu from "@/components/layout/UserMenu";
import type { QuoteStatus } from "@/generated/prisma/enums";

type SidebarQuote = { id: string; title: string; status: QuoteStatus };
type SidebarUser = { displayName: string; email: string; avatarUrl: string | null };

export default function Sidebar({ quotes, user }: { quotes: SidebarQuote[]; user: SidebarUser }) {
  const pathname = usePathname();

  return (
    <aside
      className="liquid-glass flex w-64 shrink-0 flex-col"
      style={{ "--liquid-glass-bg": "rgba(24, 24, 27, 0.4)" } as React.CSSProperties}
    >
      <div className="flex items-center gap-3 px-4 py-4">
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

      <div className="p-3">
        <form action={createDraftQuote}>
          <Button type="submit" className="w-full">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Nuevo presupuesto
          </Button>
        </form>
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
                  className={`focus-visible:ring-accent/40 flex items-center gap-2 truncate rounded-xl border-l-2 py-2 pr-8 pl-3 text-sm transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none ${
                    isActive
                      ? "border-white bg-white/10 text-foreground font-medium"
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
    </aside>
  );
}
