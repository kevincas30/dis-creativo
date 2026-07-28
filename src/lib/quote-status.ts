import type { QuoteStatus } from "@/generated/prisma/enums";

export const QUOTE_STATUS_ORDER: QuoteStatus[] = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "ARCHIVED"];

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; dotClassName: string; badgeClassName: string }> = {
  DRAFT: {
    label: "Pendiente",
    dotClassName: "bg-amber-400",
    badgeClassName: "border-amber-400/20 bg-amber-400/10 text-amber-300",
  },
  SENT: {
    label: "Enviado",
    dotClassName: "bg-blue-500",
    badgeClassName: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  },
  ACCEPTED: {
    label: "Aprobado",
    dotClassName: "bg-emerald-500",
    badgeClassName: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  },
  REJECTED: {
    label: "Rechazado",
    dotClassName: "bg-red-500",
    badgeClassName: "border-red-500/20 bg-red-500/10 text-red-300",
  },
  ARCHIVED: {
    label: "Archivado",
    dotClassName: "bg-zinc-500",
    badgeClassName: "border-zinc-500/20 bg-zinc-500/10 text-zinc-300",
  },
};
