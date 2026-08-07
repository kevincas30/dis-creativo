import { formatTime } from "@/lib/dashboard-agenda-dates";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function EventTimelineCard({ event, top, height }: { event: EventSnapshot; top: number; height: number }) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <div
      className={`absolute right-0 left-0 overflow-hidden rounded-lg border px-2 py-1 ${config.badgeClassName}`}
      style={{ top, height }}
    >
      <p className="truncate text-xs leading-tight font-medium">{event.title}</p>
      {height > 34 ? (
        <p className="truncate text-[10px] opacity-80">
          {formatTime(new Date(event.startAt))} – {formatTime(new Date(event.endAt))}
        </p>
      ) : null}
    </div>
  );
}
