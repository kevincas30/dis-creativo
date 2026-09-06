import Link from "next/link";
import { ArrowUpRight, CalendarDays, FolderKanban, ListChecks } from "lucide-react";
import { getCurrentUser } from "@/lib/current-user";
import { firstNameOf } from "@/lib/names";
import { prisma } from "@/lib/prisma";
import { getRecentActivity } from "@/lib/activity";
import { addDays, startOfDay, toDateInputValue, formatDayLabel, formatTime } from "@/lib/dashboard-agenda-dates";
import { PROJECT_STATUS_CONFIG } from "@/lib/project-status";
import { EVENT_TYPE_CONFIG } from "@/lib/event-type";
import { prioritizeProjects, projectAttention } from "@/lib/workspace-summary";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import WorkspaceActions from "@/components/dashboard/WorkspaceActions";
import RecentActivityCard from "@/components/home/RecentActivityCard";

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

const TEXT_LINK = "text-accent inline-flex items-center gap-1 rounded text-xs font-medium hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";

export default async function DashboardHome() {
  const user = await getCurrentUser();
  const now = new Date();
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  const todayKey = toDateInputValue(today);
  const [events, projects, activity] = await Promise.all([
    prisma.event.findMany({
      where: { userId: user.id, startAt: { lt: tomorrow }, endAt: { gt: today } },
      orderBy: { startAt: "asc" },
      select: {
        id: true, title: true, type: true, startAt: true, endAt: true,
        project: { select: { id: true, name: true, userId: true } },
        client: { select: { name: true } },
      },
    }),
    prisma.project.findMany({
      where: { userId: user.id, status: { not: "DONE" } },
      select: { id: true, name: true, client: true, type: true, status: true, dueDate: true, updatedAt: true },
    }),
    getRecentActivity(user.id, 4),
  ]);
  const orderedProjects = prioritizeProjects(projects, todayKey);
  const attentionCount = orderedProjects.filter((project) => projectAttention(project, todayKey)).length;

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-4 py-6 sm:px-10 sm:py-10 lg:px-16">
      <DashboardBackground />
      <div className="mx-auto w-full max-w-6xl space-y-8 pb-10">
        <header className="animate-fade-in-up space-y-5">
          <div>
            <p className="text-muted-foreground mb-2 text-xs">{formatDayLabel(today)}</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greetingFor(now.getHours())}, {firstNameOf(user.displayName)}
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              {events.length === 0 ? "Sin compromisos en agenda para hoy" : `${events.length} ${events.length === 1 ? "compromiso" : "compromisos"} para hoy`}
              {" · "}
              {attentionCount === 0 ? "Sin proyectos con revisión o entrega pendiente" : `${attentionCount} ${attentionCount === 1 ? "proyecto necesita" : "proyectos necesitan"} atención`}
            </p>
          </div>
          <WorkspaceActions />
        </header>

        <div className="grid items-start gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section aria-labelledby="today-heading" className="liquid-glass animate-fade-in-up min-w-0 rounded-2xl p-5 sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 id="today-heading" className="flex items-center gap-2 text-base font-semibold">
                <CalendarDays className="text-accent h-4 w-4" aria-hidden /> Hoy
              </h2>
              <Link href="/agenda" className={TEXT_LINK}>Ver agenda <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </div>
            <p className="text-muted-foreground mb-2 text-xs font-medium">Compromisos de agenda</p>
            {events.length === 0 ? (
              <div className="py-5">
                <p className="text-sm font-medium">Hoy no hay compromisos agendados.</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">Puedes dedicar este espacio a avanzar en tus proyectos activos.</p>
              </div>
            ) : (
              <ul className="divide-surface-border divide-y">
                {events.map((event) => {
                  const project = event.project?.userId === user.id ? event.project : null;
                  return (
                    <li key={event.id} className="flex gap-3 py-3.5">
                      <span className="text-muted-foreground w-16 shrink-0 pt-0.5 text-xs tabular-nums">
                        {event.startAt < today ? "En curso" : formatTime(event.startAt)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-medium">{event.title}</p>
                        <p className="text-muted-foreground mt-1 text-xs">{EVENT_TYPE_CONFIG[event.type].label}{event.client ? ` · ${event.client.name}` : ""}</p>
                        {project ? (
                          <Link href={`/projects/${project.id}`} className={`${TEXT_LINK} mt-2 max-w-full`}>
                            <span className="truncate">{project.name}</span><ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="border-surface-border mt-4 flex gap-3 border-t pt-4">
              <ListChecks className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium">Tareas por proyecto</p>
                <p className="text-muted-foreground mt-1 text-xs leading-relaxed">El módulo de tareas aún no está disponible. Por ahora, consulta los compromisos y el estado de cada proyecto.</p>
              </div>
            </div>
          </section>

          <section aria-labelledby="projects-heading" className="liquid-glass animate-fade-in-up min-w-0 rounded-2xl p-5 sm:p-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <h2 id="projects-heading" className="flex items-center gap-2 text-base font-semibold">
                <FolderKanban className="text-accent h-4 w-4" aria-hidden /> Proyectos activos
                <span className="text-muted-foreground text-xs font-normal">{orderedProjects.length}</span>
              </h2>
              <Link href="/projects" className={TEXT_LINK}>Ver todos <ArrowUpRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </div>
            <p className="text-muted-foreground mb-3 text-xs">Primero, entregas pendientes y proyectos en revisión.</p>
            {orderedProjects.length === 0 ? (
              <div className="py-6">
                <p className="text-sm font-medium">No hay proyectos activos.</p>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">Cuando crees un proyecto, podrás seguir su estado y próximas entregas aquí.</p>
              </div>
            ) : (
              <ul className="divide-surface-border divide-y">
                {orderedProjects.slice(0, 6).map((project) => {
                  const status = PROJECT_STATUS_CONFIG[project.status];
                  const attention = projectAttention(project, todayKey);
                  return (
                    <li key={project.id}>
                      <Link href={`/projects/${project.id}`} className="hover:bg-foreground/5 focus-visible:ring-accent/40 -mx-2 block rounded-xl px-2 py-3.5 transition-colors focus-visible:outline-none focus-visible:ring-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="min-w-0 break-words text-sm font-medium">{project.name}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] ${status.badgeClassName}`}>{status.label}</span>
                        </div>
                        <p className="text-muted-foreground mt-1 break-words text-xs">{project.client}{project.type ? ` · ${project.type}` : ""}</p>
                        {attention ? <p className="mt-2 text-xs text-amber-300">{attention}</p> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
            {orderedProjects.length > 6 ? <p className="text-muted-foreground mt-3 text-xs">Mostrando 6 de {orderedProjects.length} proyectos activos.</p> : null}
          </section>
        </div>

        <section aria-label="Actividad reciente de presupuestos" className="max-w-2xl">
          <RecentActivityCard events={activity} />
        </section>
      </div>
    </div>
  );
}
