import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function EventChip({ event }: { event: EventSnapshot }) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <div
      title={event.title}
      className={`flex w-full items-center gap-1.5 truncate rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors duration-150 hover:border-white/30 ${config.badgeClassName}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dot}`} />
      <span className="truncate">{event.title}</span>
    </div>
  );
}
