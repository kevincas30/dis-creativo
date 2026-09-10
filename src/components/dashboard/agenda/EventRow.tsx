"use client";

import { useRouter } from "next/navigation";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export default function EventRow({ event, metaLine, onClick }: { event: AgendaItemSnapshot; metaLine: string; onClick?: () => void }) {
  const router = useRouter();
  const config = EVENT_TYPE_CONFIG[event.type];
  const open = onClick ?? (event.href ? () => router.push(event.href!) : undefined);
  return (
    <div role={open ? "button" : undefined} tabIndex={open ? 0 : undefined} onClick={open} onKeyDown={open ? (event) => { if (event.key === "Enter" || event.key === " ") open(); } : undefined} className={`flex w-full items-start gap-3 py-2.5 text-left ${open ? "hover:bg-foreground/5 -mx-2 cursor-pointer rounded-xl px-2 transition-colors duration-150" : ""}`}>
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${event.agendaKind === "PROJECT_START" ? "bg-blue-500/15 text-blue-300" : event.agendaKind === "PROJECT_DUE" ? "bg-amber-500/15 text-amber-300" : config.iconBgClassName}`}><config.icon className="h-3.5 w-3.5" strokeWidth={1.75} /></div>
      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{event.title}</p><p className="text-muted-foreground truncate text-xs">{event.allDay ? "Todo el día" : metaLine}{event.client ? ` · ${event.client.name}` : ""}</p></div>
      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${event.agendaKind ? "border-blue-400/30 bg-blue-400/10 text-blue-200" : config.badgeClassName}`}>{event.agendaKind === "PROJECT_START" ? "Inicio" : event.agendaKind === "PROJECT_DUE" ? "Entrega" : config.label}</span>
    </div>
  );
}
