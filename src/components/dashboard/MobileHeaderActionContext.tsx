"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type MobileHeaderActionContextValue = {
  action: ReactNode | null;
  setAction: (node: ReactNode | null) => void;
};

const MobileHeaderActionContext = createContext<MobileHeaderActionContextValue | null>(null);

export function MobileHeaderActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<ReactNode | null>(null);
  return (
    <MobileHeaderActionContext.Provider value={{ action, setAction }}>{children}</MobileHeaderActionContext.Provider>
  );
}

/** Lee la acción contextual actual — usado por MobileTopBar para renderizarla. */
export function useMobileHeaderActionSlot(): ReactNode | null {
  const ctx = useContext(MobileHeaderActionContext);
  return ctx?.action ?? null;
}

// Registra la acción de la esquina derecha de la barra superior móvil (p. ej.
// el botón "+" de una página) desde cualquier punto del árbol. Se registra
// una sola vez al montar — el nodo no depende de estado que cambie, solo de
// setters de useState (siempre estables) — y se limpia sola al desmontar
// para que la página activa sea la única dueña del slot.
export function useMobileHeaderAction(node: ReactNode) {
  const ctx = useContext(MobileHeaderActionContext);
  useEffect(() => {
    if (!ctx) return;
    ctx.setAction(node);
    return () => ctx.setAction(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
