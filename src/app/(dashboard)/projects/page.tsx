import { isActiveProject } from "@/lib/project-status";
import RecordedActivity from "@/components/dashboard/RecordedActivity";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { serializeProject } from "@/lib/project-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ProjectsPageClient from "@/components/dashboard/projects/ProjectsPageClient";
import type { ProjectsStats } from "@/components/dashboard/projects/ProjectsStatsGrid";

export default async function ProjectsPage() {
  const { workspace } = await requireWorkspaceMembership();

  const projects = await prisma.project.findMany({
    where: { workspaceId: workspace.id, archivedAt: null },
    orderBy: { createdAt: "desc" },
    include: { periods: { orderBy: { startDate: "desc" } } },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const activeProjects = projects.filter(isActiveProject);
  const snapshots = projects.map((project) => serializeProject({
    ...project,
    currentPeriod: project.kind === "RECURRING"
      ? project.periods.find((period) => !["DONE", "CLOSED", "CANCELLED"].includes(period.status)) ?? project.periods[0] ?? null
      : null,
  }));
  const stats: ProjectsStats = {
    active: activeProjects.length,
    inReview: snapshots.filter((project) => (project.kind === "RECURRING" ? project.currentPeriod?.status : project.status) === "REVIEW").length,
    finishedThisMonth: projects.filter(
      (project) => project.status === "DONE" && project.updatedAt >= startOfMonth && project.updatedAt < startOfNextMonth,
    ).length,
    averageProgress:
      activeProjects.length === 0
        ? null
        : Math.round(activeProjects.reduce((sum, project) => sum + project.progress, 0) / activeProjects.length),
  };

  const activity = await prisma.activityRecord.findMany({ where: { workspaceId: workspace.id }, include: { actor: { select: { displayName: true } } }, orderBy: { createdAt: "desc" }, take: 8 });
  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-6xl flex-1 pb-12">
        <ProjectsPageClient projects={snapshots} stats={stats} />
        <div className="mt-6"><RecordedActivity events={activity} /></div>
      </div>
    </div>
  );
}
