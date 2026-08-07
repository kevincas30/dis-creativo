import Link from "next/link";
import type { QuoteStatus } from "@/generated/prisma/enums";
import { AGENDA_STATUS_COLORS } from "./agenda-colors";

export type UpcomingFollowUp = {
  id: string;
  clientName: string;
  status: QuoteStatus;
  date: string;
};

function formatShortDate(value: string): string {
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) return "Hoy";
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(date);
}

export default function UpcomingFollowUps({ items }: { items: UpcomingFollowUp[] }) {
  if (items.length === 0) {
    return <p className="text-muted-foreground text-sm">Sin seguimientos próximos.</p>;
  }

  return (
    <div className="space-y-1">
      {items.map((item) => {
        const colors = AGENDA_STATUS_COLORS[item.status];
        return (
          <Link
            key={item.id}
            href={`/quotes/${item.id}`}
            className="hover:bg-foreground/5 flex items-center justify-between gap-2 rounded-xl px-2 py-1.5 text-sm transition-colors"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${colors.dot}`} />
              <span className="truncate">{item.clientName}</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">{formatShortDate(item.date)}</span>
          </Link>
        );
      })}
    </div>
  );
}
