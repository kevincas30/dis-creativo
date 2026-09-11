import { MoreHorizontal } from "lucide-react";
import { formatTime } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { AgendaItemSnapshot } from "@/lib/event-presenter";

export default function EventTimelineCard({ event, top, height, onOpen, onMore }: { event: AgendaItemSnapshot; top: number; height: number; onOpen?: (event: AgendaItemSnapshot) => void; onMore?: (click: React.MouseEvent, event: AgendaItemSnapshot) => void }) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <div
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen ? () => onOpen(event) : undefined}
      onKeyDown={onOpen ? (key) => { if (key.key === "Enter" || key.key === " ") { key.preventDefault(); onOpen(event); } } : undefined}
      className={`absolute right-0 left-0 overflow-hidden rounded-lg border px-2 py-1 ${onOpen ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60" : ""} ${config.badgeClassName}`}
      style={{ top, height }}
    >
      <div className="flex items-start gap-1"><p className="min-w-0 flex-1 truncate text-xs leading-tight font-medium">{event.title}</p>{onMore ? <button type="button" aria-label="Más acciones" className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-md hover:bg-black/10" onClick={(click) => { click.stopPropagation(); onMore(click, event); }}><MoreHorizontal className="h-4 w-4" /></button> : null}</div>
      {height > 34 ? (
        <p className="truncate text-[10px] opacity-80">
          {formatTime(new Date(event.startAt))} – {formatTime(new Date(event.endAt))}
        </p>
      ) : null}
    </div>
  );
}
