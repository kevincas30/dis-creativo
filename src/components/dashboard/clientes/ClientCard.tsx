import Link from "next/link";
import { Mail, Phone, MapPin, FolderKanban, FileText, Clock } from "lucide-react";
import Avatar from "@/components/ui/Avatar";
import { CLIENT_STATUS_CONFIG } from "@/lib/client-status";
import type { ClientCardData } from "@/lib/client-relations";

function formatLastContact(value: string | null): string {
  if (!value) return "Sin contacto todavía";
  const date = new Date(value);
  const now = new Date();
  const diffDays = Math.round((now.getTime() - date.getTime()) / 86400000);
  if (diffDays <= 0) return "Hoy";
  if (diffDays === 1) return "Ayer";
  if (diffDays < 30) return `Hace ${diffDays} d`;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export default function ClientCard({ client }: { client: ClientCardData }) {
  const config = CLIENT_STATUS_CONFIG[client.status];

  return (
    <Link
      href={`/clientes/${client.id}`}
      className="liquid-glass focus-visible:ring-accent/40 group flex flex-col gap-3 rounded-2xl p-4 transition-all duration-200 ease-out hover:-translate-y-px focus-visible:ring-2 focus-visible:outline-none"
      style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar name={client.displayName} className="h-10 w-10 text-sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{client.displayName}</p>
            <p className="text-muted-foreground truncate text-xs">{client.company ?? "Sin empresa"}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${config.badgeClassName}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
          {config.label}
        </span>
      </div>

      <div className="space-y-1 text-xs">
        <p className="text-muted-foreground flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{client.email ?? "Sin email"}</span>
        </p>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{client.phone ?? "Sin teléfono"}</span>
        </p>
        <p className="text-muted-foreground flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          <span className="truncate">{client.country ?? "Sin país"}</span>
        </p>
      </div>

      <div className="border-surface-border flex items-center justify-between border-t pt-3 text-xs">
        <span className="text-muted-foreground flex items-center gap-1.5">
          <FolderKanban className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {client.projectCount}
        </span>
        <span className="text-muted-foreground flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {client.quoteCount}
        </span>
        <span className="text-muted-foreground flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          {formatLastContact(client.lastContact)}
        </span>
      </div>
    </Link>
  );
}
