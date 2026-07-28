"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { ChevronDown, Check } from "lucide-react";
import type { QuoteStatus } from "@/generated/prisma/enums";
import { QUOTE_STATUS_ORDER, QUOTE_STATUS_CONFIG } from "@/lib/quote-status";
import { updateQuoteStatus } from "@/app/(app)/quotes/actions";
import { useMounted } from "@/components/ui/Modal";

type MenuPosition = { top: number; left: number };

export default function StatusBadge({
  quoteId,
  status,
  onStatusChange,
}: {
  quoteId: string;
  status: QuoteStatus;
  onStatusChange: (status: QuoteStatus) => void;
}) {
  const router = useRouter();
  const mounted = useMounted();
  const [isOpen, setIsOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const [isPending, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  function handleToggle() {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setMenuPos({ top: rect.bottom + 6, left: rect.left });
      }
      return next;
    });
  }

  function handleSelect(next: QuoteStatus) {
    setIsOpen(false);
    if (next === status) return;
    onStatusChange(next);
    startTransition(async () => {
      await updateQuoteStatus(quoteId, next);
      router.refresh();
    });
  }

  const config = QUOTE_STATUS_CONFIG[status];

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors duration-150 disabled:opacity-60 ${config.badgeClassName}`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClassName}`} />
        {config.label}
        <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2} />
      </button>

      {mounted && isOpen && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{ top: menuPos.top, left: menuPos.left }}
              className="bg-surface-solid/95 border-surface-border shadow-elevated animate-scale-in fixed z-20 w-44 origin-top-left overflow-hidden rounded-xl border py-1 backdrop-blur-sm"
            >
              {QUOTE_STATUS_ORDER.map((option) => {
                const optionConfig = QUOTE_STATUS_CONFIG[option];
                const isSelected = option === status;
                return (
                  <button
                    key={option}
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelect(option)}
                    className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-150 hover:bg-foreground/5 ${
                      isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${optionConfig.dotClassName}`} />
                    {optionConfig.label}
                    {isSelected ? <Check className="ml-auto h-3.5 w-3.5" strokeWidth={2} /> : null}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
