type Meeting = { id: string; title: string; withWhom: string; whenLabel: string };

// Ejemplo — la Agenda comercial todavía no está conectada.
const MEETINGS: Meeting[] = [
  { id: "1", title: "Revisión de propuesta", withWhom: "Laura Arvenz", whenLabel: "Hoy, 4:00 pm" },
  { id: "2", title: "Kickoff de proyecto", withWhom: "OBED", whenLabel: "Mañana, 10:00 am" },
  { id: "3", title: "Seguimiento comercial", withWhom: "Barbería Cancún", whenLabel: "Jueves, 1:00 pm" },
];

export default function UpcomingMeetingsCard() {
  return (
    <div className="liquid-glass animate-fade-in-up rounded-2xl p-4" style={{ animationDelay: "340ms" }}>
      <h3 className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">Reuniones próximas</h3>

      <div className="divide-surface-border divide-y">
        {MEETINGS.map((meeting) => (
          <div key={meeting.id} className="flex items-center justify-between gap-2 py-2 text-sm">
            <span className="min-w-0 flex-1">
              <p className="truncate font-medium">{meeting.title}</p>
              <p className="text-muted-foreground truncate text-xs">{meeting.withWhom}</p>
            </span>
            <span className="text-muted-foreground shrink-0 text-xs">{meeting.whenLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
