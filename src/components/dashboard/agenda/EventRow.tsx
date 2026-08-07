import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function EventRow({ event, metaLine, onClick }: { event: EventSnapshot; metaLine: string; onClick?: () => void }) {
  const config = EVENT_TYPE_CONFIG[event.type];

  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") onClick();
            }
          : undefined
      }
      className={`flex w-full items-start gap-3 py-2.5 text-left ${
        onClick ? "hover:bg-foreground/5 -mx-2 cursor-pointer rounded-xl px-2 transition-colors duration-150" : ""
      }`}
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.iconBgClassName}`}>
        <config.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{event.title}</p>
        <p className="text-muted-foreground truncate text-xs">
          {metaLine}
          {event.client ? ` · ${event.client.name}` : ""}
        </p>
      </div>
      <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-medium ${config.badgeClassName}`}>{config.label}</span>
    </div>
  );
}
