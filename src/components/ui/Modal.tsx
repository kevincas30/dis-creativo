"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

function subscribeNoop() {
  return () => {};
}

// El portal solo puede crearse en el cliente (document no existe durante el
// render en servidor); useSyncExternalStore evita el mismatch de hidratación
// sin recurrir a un setState dentro de un efecto.
export function useMounted() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export default function Modal({
  isOpen,
  onClose,
  children,
  className = "max-w-sm",
}: {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const mounted = useMounted();

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-fade-in-up absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={`animate-scale-in bg-surface-solid/95 border-surface-border shadow-elevated relative w-full rounded-2xl border p-6 backdrop-blur-sm ${className}`}>
        {children}
      </div>
    </div>,
    document.body,
  );
}
