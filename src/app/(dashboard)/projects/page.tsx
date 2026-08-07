import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeProject } from "@/lib/project-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ProjectsPageClient from "@/components/dashboard/projects/ProjectsPageClient";
import type { ProjectsStats } from "@/components/dashboard/projects/ProjectsStatsGrid";

export default async function ProjectsPage() {
  const user = await getCurrentUser();

  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const activeProjects = projects.filter((project) => project.status !== "DONE");
  const stats: ProjectsStats = {
    active: activeProjects.length,
    inReview: projects.filter((project) => project.status === "REVIEW").length,
    finishedThisMonth: projects.filter(
      (project) => project.status === "DONE" && project.updatedAt >= startOfMonth && project.updatedAt < startOfNextMonth,
    ).length,
    averageProgress:
      activeProjects.length === 0
        ? null
        : Math.round(activeProjects.reduce((sum, project) => sum + project.progress, 0) / activeProjects.length),
  };

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="mx-auto w-full max-w-6xl flex-1 pb-12">
        <ProjectsPageClient projects={projects.map(serializeProject)} stats={stats} />
      </div>
    </div>
  );
}
