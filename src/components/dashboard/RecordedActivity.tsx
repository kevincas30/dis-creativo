import Link from "next/link";
export type RecordedEvent = { id: string; description: string; createdAt: Date; projectId: string | null; periodId: string | null; actor: { displayName: string } };
export default function RecordedActivity({ events }: { events: RecordedEvent[] }) {
  return <section className="liquid-glass rounded-2xl p-5"><h2 className="mb-4 text-sm font-semibold">Actividad reciente</h2>{events.length ? <ul className="space-y-3">{events.map((e) => <li key={e.id} className="text-sm">{e.projectId ? <Link href={`/projects/${e.projectId}${e.periodId ? `?period=${e.periodId}` : ""}`}>{e.description}</Link> : e.description}<p className="text-xs text-muted-foreground">{e.actor.displayName} · {e.createdAt.toLocaleString("es")}</p></li>)}</ul> : <p className="text-sm text-muted-foreground">Sin actividad registrada. Las nuevas acciones aparecerán aquí.</p>}</section>;
}
