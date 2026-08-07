import { FileText, FolderKanban, CalendarDays } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type ClientActivityItem = {
  id: string;
  type: "quote" | "project" | "event";
  label: string;
  subject: string;
  when: string;
};

const ICON_BY_TYPE: Record<ClientActivityItem["type"], LucideIcon> = {
  quote: FileText,
  project: FolderKanban,
  event: CalendarDays,
};

function formatRelative(value: string): string {
  const date = new Date(value);
  const now = new Date();
  const diffMin = Math.round((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return "ayer";
  return `hace ${diffDays} d`;
}

export default function ClientActivityTab({ items }: { items: ClientActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="liquid-glass rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">Todavía no hay actividad registrada con este cliente.</p>
      </div>
    );
  }

  return (
    <div className="liquid-glass divide-surface-border divide-y overflow-hidden rounded-2xl">
      {items.map((item) => {
        const Icon = ICON_BY_TYPE[item.type];
        return (
          <div key={item.id} className="flex items-center gap-3 p-4 text-sm">
            <span className="bg-accent-soft flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
              <Icon className="text-foreground h-3.5 w-3.5" strokeWidth={1.75} />
            </span>
            <span className="min-w-0 flex-1">
              <p className="truncate">{item.label}</p>
              <p className="text-muted-foreground truncate text-xs">{item.subject}</p>
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">{formatRelative(item.when)}</span>
          </div>
        );
      })}
    </div>
  );
}
