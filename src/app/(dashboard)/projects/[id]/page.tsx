import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { getWorkView } from "@/lib/work-view";
import ProjectWorkPanel from "@/components/dashboard/projects/ProjectWorkPanel";
import { serializeProject } from "@/lib/project-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ProjectDetailClient from "@/components/dashboard/projects/ProjectDetailClient";

export default async function ProjectDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ period?: string }> }) {
  const { id } = await params;
  const { workspace, membership } = await requireWorkspaceMembership();

  const project = await prisma.project.findFirst({ where: { id, workspaceId: workspace.id } });
  if (!project) {
    notFound();
  }

  const view = await getWorkView(id, workspace.id);
  const { period } = await searchParams;
  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />
      <div className="mx-auto w-full max-w-4xl pb-12 space-y-6">
        <ProjectDetailClient key={project.updatedAt.toISOString()} project={serializeProject(project)} role={membership.role} />
        <ProjectWorkPanel key={period ?? "current"} view={view} selectedPeriodId={period} role={membership.role} />
      </div>
    </div>
  );
}
