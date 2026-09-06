"use client";

import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { LIQUID_GLASS_VARS, NAV_ITEMS, SECONDARY_NAV_ITEMS } from "@/components/dashboard/GlobalSidebar";
import { useMobileHeaderActionSlot } from "@/components/dashboard/MobileHeaderActionContext";

export default function MobileTopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const sectionTitle = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS].find((item) => item.isActive(pathname))?.label ?? "Diseño Creativo";
  const action = useMobileHeaderActionSlot();

  return (
    <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between gap-3 px-4 pt-[max(env(safe-area-inset-top),0.75rem)] pb-3 md:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Abrir menú"
        style={LIQUID_GLASS_VARS}
        className="liquid-glass text-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform duration-150 active:scale-[0.92]"
      >
        <Menu className="h-4 w-4" strokeWidth={1.75} />
      </button>

      <h1 className="min-w-0 flex-1 truncate text-center text-sm font-semibold tracking-tight">{sectionTitle}</h1>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center">{action}</div>
    </div>
  );
}
