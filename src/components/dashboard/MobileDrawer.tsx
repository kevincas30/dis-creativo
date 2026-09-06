"use client";

import { useEffect, useRef, type TouchEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import UserMenu from "@/components/layout/UserMenu";
import { ACTIVE_NAV_GLASS_VARS, LIQUID_GLASS_VARS, NAV_ITEMS, MoreNavigation, type SidebarUser } from "@/components/dashboard/GlobalSidebar";

const SWIPE_CLOSE_THRESHOLD_PX = 60;

export default function MobileDrawer({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  user: SidebarUser;
}) {
  const pathname = usePathname();
  const touchStartX = useRef<number | null>(null);

  // Bloquear el scroll del fondo mientras el menú está abierto.
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const start = touchStartX.current;
    touchStartX.current = null;
    if (start === null) return;
    const deltaX = event.changedTouches[0].clientX - start;
    if (deltaX < -SWIPE_CLOSE_THRESHOLD_PX) onClose();
  }

  return (
    <div className="md:hidden">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        aria-hidden={!isOpen}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`liquid-glass fixed inset-y-0 left-0 z-50 flex w-4/5 max-w-sm flex-col overflow-hidden shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={LIQUID_GLASS_VARS}
      >
        <div className="flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-4">
          <Image src="/logo.svg" alt="Diseño Creativo" width={36} height={36} className="rounded-full" />
          <h2 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">Diseño Creativo</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="text-muted-foreground hover:bg-foreground/5 hover:text-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150"
          >
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3">
          {NAV_ITEMS.map((item) => {
            const isActive = item.isActive(pathname);
            return (
              <Link
                key={item.label}
                href={item.href}
                target={item.openInNewTab ? "_blank" : undefined}
                rel={item.openInNewTab ? "noopener noreferrer" : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={onClose}
                style={isActive ? ACTIVE_NAV_GLASS_VARS : undefined}
                className={`focus-visible:ring-accent/40 flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-sm transition-all duration-150 focus-visible:ring-2 focus-visible:outline-none ${
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
          <MoreNavigation pathname={pathname} onNavigate={onClose} />
        </nav>

        <div className="border-surface-border border-t p-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]">
          <UserMenu initialUser={user} />
        </div>
      </div>
    </div>
  );
}
