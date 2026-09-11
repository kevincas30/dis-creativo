import { CalendarDays, Flag } from "lucide-react";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export default function EventChip({ event }: { event: AgendaItemSnapshot }) {
  const config = EVENT_TYPE_CONFIG[event.type];
  const Icon = event.agendaKind === "PROJECT_START" || event.agendaKind === "TASK_START" ? CalendarDays : event.agendaKind === "PROJECT_DUE" || event.agendaKind === "TASK_DUE" ? Flag : null;
  return <div title={event.title} className={`flex w-full items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors duration-150 hover:border-white/30 ${event.agendaKind === "PROJECT_START" ? "border-blue-400/30 bg-blue-400/10 text-blue-100" : event.agendaKind === "TASK_START" ? "border-violet-400/30 bg-violet-400/10 text-violet-100" : event.agendaKind === "TASK_DUE" ? "border-rose-400/30 bg-rose-400/10 text-rose-100" : event.agendaKind === "PROJECT_DUE" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : config.badgeClassName}`}>{Icon ? <Icon className="h-3 w-3 shrink-0" /> : <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />}<span className="truncate">{event.title}</span></div>;
}
