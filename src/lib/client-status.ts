import type { ClientStatus } from "@/generated/prisma/enums";

export const CLIENT_STATUS_ORDER: ClientStatus[] = ["ACTIVE", "INACTIVE"];

export const CLIENT_STATUS_CONFIG: Record<ClientStatus, { label: string; dot: string; badgeClassName: string }> = {
  ACTIVE: { label: "Activo", dot: "bg-emerald-400", badgeClassName: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" },
  INACTIVE: { label: "Inactivo", dot: "bg-zinc-400", badgeClassName: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300" },
};
