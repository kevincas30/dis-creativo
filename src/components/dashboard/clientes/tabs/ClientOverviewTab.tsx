import { Globe, MapPin, StickyNote } from "lucide-react";
import type { ClientSnapshot } from "@/lib/client-presenter";

export default function ClientOverviewTab({ client }: { client: ClientSnapshot }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="liquid-glass rounded-2xl p-4">
        <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Datos generales</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-muted-foreground text-xs">Dirección</p>
              <p>{client.address ?? "Sin dirección registrada"}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Globe className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-muted-foreground text-xs">Sitio web</p>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:opacity-80 break-all transition-opacity"
                >
                  {client.website}
                </a>
              ) : (
                <p>Sin sitio web</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-4">
        <h3 className="text-muted-foreground mb-3 flex items-center gap-1.5 text-xs font-medium tracking-wide uppercase">
          <StickyNote className="h-3.5 w-3.5" strokeWidth={1.75} />
          Notas internas
        </h3>
        <p className="text-sm whitespace-pre-wrap">{client.notes ?? "Sin notas todavía."}</p>
      </div>
    </div>
  );
}
