"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { LIQUID_GLASS_VARS, NAV_ITEMS } from "@/components/dashboard/GlobalSidebar";

export default function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const sectionTitle = NAV_ITEMS.find((item) => item.isActive(pathname))?.label ?? "Diseño Creativo";

  return (
    <div
      className="liquid-glass border-surface-border sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 md:hidden"
      style={LIQUID_GLASS_VARS}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        className="text-foreground hover:bg-foreground/5 focus-visible:ring-accent/40 -ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Menu className="h-5 w-5" strokeWidth={1.75} />
      </button>

      <Image src="/logo.svg" alt="Diseño Creativo" width={28} height={28} className="shrink-0 rounded-full" />

      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight">{sectionTitle}</h1>
    </div>
  );
}
