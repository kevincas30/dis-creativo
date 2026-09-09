import type { QuoteStatus } from "@/generated/prisma/enums";

// Colores del calendario/Agenda — deliberadamente independientes de
// src/lib/quote-status.ts (que ya se ajustó a pedido en el chat/panel de
// presupuesto). El brief pide exactamente: Pendiente=amarillo, Enviado=azul,
// Aprobado=verde, Pagado=cyan. Rechazado/Archivado no se especificaron —
// se les da un color neutro por si aparecen en el calendario.
export const AGENDA_STATUS_COLORS: Record<
  QuoteStatus,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  DRAFT: { label: "Pendiente", dot: "bg-amber-400", text: "text-amber-300", bg: "bg-amber-400/10", border: "border-amber-400/30" },
  READY_TO_SEND: { label: "Listo para enviar", dot: "bg-indigo-400", text: "text-indigo-300", bg: "bg-indigo-400/10", border: "border-indigo-400/30" },
  SENT: { label: "Enviado", dot: "bg-blue-400", text: "text-blue-300", bg: "bg-blue-400/10", border: "border-blue-400/30" },
  ACCEPTED: {
    label: "Aprobado",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  PAID: { label: "Pagado", dot: "bg-cyan-400", text: "text-cyan-300", bg: "bg-cyan-400/10", border: "border-cyan-400/30" },
  REJECTED: { label: "Rechazado", dot: "bg-red-400", text: "text-red-300", bg: "bg-red-400/10", border: "border-red-400/30" },
  EXPIRED: { label: "Vencido", dot: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-400/10", border: "border-orange-400/30" },
  ARCHIVED: { label: "Archivado", dot: "bg-zinc-400", text: "text-zinc-300", bg: "bg-zinc-400/10", border: "border-zinc-400/30" },
};

export const AGENDA_STATUS_ORDER: QuoteStatus[] = ["DRAFT", "READY_TO_SEND", "SENT", "ACCEPTED", "PAID", "REJECTED", "EXPIRED", "ARCHIVED"];
