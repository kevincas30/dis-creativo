import type { LeadSource, ProspectStatus } from "@/generated/prisma/enums";

export const PROSPECT_STATUS_ORDER: ProspectStatus[] = ["NEW", "CONTACTED", "QUOTE", "WON", "LOST"];
export const LEAD_SOURCE_ORDER: LeadSource[] = ["INSTAGRAM", "WHATSAPP", "REFERRAL", "DIRECT", "OTHER"];

export const PROSPECT_STATUS_LABEL: Record<ProspectStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUOTE: "Con presupuesto",
  WON: "Ganado",
  LOST: "Perdido",
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  REFERRAL: "Recomendación",
  DIRECT: "Directo",
  OTHER: "Otro",
};

export function followUpLabel(value: string | null) {
  if (!value) return "Sin seguimiento";
  const date = new Date(value);
  const today = new Date();
  const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (startDate < startToday) return "Vencido";
  if (startDate === startToday) return "Hoy";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}
