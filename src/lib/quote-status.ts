import type { QuoteStatus } from "@/generated/prisma/enums";

// Usado por StatusBadge (chat / QuoteDocumentCard) — no incluye PAID a
// propósito, para no cambiar las opciones que ya ve el chat.
export const QUOTE_STATUS_ORDER: QuoteStatus[] = ["DRAFT", "READY_TO_SEND", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "ARCHIVED"];

// Usado por el <select> del panel derecho (QuoteTrackingPanel) — solo el
// ciclo de vida comercial "feliz": pendiente -> enviado -> aprobado -> pagado.
export const RIGHT_PANEL_STATUS_ORDER: QuoteStatus[] = ["DRAFT", "SENT", "ACCEPTED", "PAID"];

export const QUOTE_STATUS_CONFIG: Record<
  QuoteStatus,
  {
    label: string;
    dotClassName: string;
    badgeClassName: string;
    /// Solo borde + fondo, sin color de texto — para el badge del panel
    /// derecho, donde el texto siempre debe verse blanco.
    badgeSurfaceClassName: string;
  }
> = {
  DRAFT: {
    label: "Pendiente",
    dotClassName: "bg-amber-400",
    badgeClassName: "border-amber-400/20 bg-amber-400/10 text-amber-300",
    badgeSurfaceClassName: "border-amber-400/20 bg-amber-400/10",
  },
  READY_TO_SEND: {
    label: "Listo para enviar",
    dotClassName: "bg-indigo-400",
    badgeClassName: "border-indigo-400/20 bg-indigo-400/10 text-indigo-300",
    badgeSurfaceClassName: "border-indigo-400/20 bg-indigo-400/10",
  },
  SENT: {
    label: "Enviado",
    dotClassName: "bg-blue-500",
    badgeClassName: "border-blue-500/20 bg-blue-500/10 text-blue-300",
    badgeSurfaceClassName: "border-blue-500/20 bg-blue-500/10",
  },
  ACCEPTED: {
    label: "Aprobado",
    dotClassName: "bg-emerald-500",
    badgeClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    badgeSurfaceClassName: "border-emerald-500/20 bg-emerald-500/10",
  },
  REJECTED: {
    label: "Rechazado",
    dotClassName: "bg-red-500",
    badgeClassName: "border-red-500/20 bg-red-500/10 text-red-300",
    badgeSurfaceClassName: "border-red-500/20 bg-red-500/10",
  },
  EXPIRED: {
    label: "Vencido",
    dotClassName: "bg-orange-400",
    badgeClassName: "border-orange-400/20 bg-orange-400/10 text-orange-300",
    badgeSurfaceClassName: "border-orange-400/20 bg-orange-400/10",
  },
  ARCHIVED: {
    label: "Archivado",
    dotClassName: "bg-zinc-500",
    badgeClassName: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
    badgeSurfaceClassName: "border-zinc-500/20 bg-zinc-500/10",
  },
  PAID: {
    label: "Pagado",
    dotClassName: "bg-violet-500",
    badgeClassName: "border-violet-500/20 bg-violet-500/10 text-violet-300",
    badgeSurfaceClassName: "border-violet-500/20 bg-violet-500/10",
  },
};
