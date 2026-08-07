import { Users, PackageCheck, Eye, CreditCard, Bell } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { EventType } from "@/generated/prisma/enums";

export const EVENT_TYPE_ORDER: EventType[] = ["MEETING", "DELIVERY", "REVIEW", "PAYMENT", "REMINDER"];

export const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; icon: LucideIcon; dot: string; badgeClassName: string; iconBgClassName: string }
> = {
  MEETING: {
    label: "Reunión",
    icon: Users,
    dot: "bg-blue-400",
    badgeClassName: "border-blue-400/30 bg-blue-400/10 text-blue-300",
    iconBgClassName: "bg-blue-400/15 text-blue-300",
  },
  DELIVERY: {
    label: "Entrega",
    icon: PackageCheck,
    dot: "bg-emerald-400",
    badgeClassName: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
    iconBgClassName: "bg-emerald-400/15 text-emerald-300",
  },
  REVIEW: {
    label: "Revisión",
    icon: Eye,
    dot: "bg-amber-400",
    badgeClassName: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    iconBgClassName: "bg-amber-400/15 text-amber-300",
  },
  PAYMENT: {
    label: "Pago",
    icon: CreditCard,
    dot: "bg-violet-400",
    badgeClassName: "border-violet-400/30 bg-violet-400/10 text-violet-300",
    iconBgClassName: "bg-violet-400/15 text-violet-300",
  },
  REMINDER: {
    label: "Recordatorio interno",
    icon: Bell,
    dot: "bg-zinc-400",
    badgeClassName: "border-zinc-400/30 bg-zinc-400/10 text-zinc-300",
    iconBgClassName: "bg-zinc-400/15 text-zinc-300",
  },
};
