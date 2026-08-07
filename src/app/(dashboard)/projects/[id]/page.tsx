import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeProject } from "@/lib/project-presenter";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ProjectDetailClient from "@/components/dashboard/projects/ProjectDetailClient";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project || project.userId !== user.id) {
    notFound();
  }

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />
      <div className="mx-auto w-full max-w-3xl pb-12">
        <ProjectDetailClient project={serializeProject(project)} />
      </div>
    </div>
  );
}
