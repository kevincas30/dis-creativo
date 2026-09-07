"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import ProjectsHeader from "@/components/dashboard/projects/ProjectsHeader";
import ProjectsStatsGrid, { type ProjectsStats } from "@/components/dashboard/projects/ProjectsStatsGrid";
import ProjectsBoard from "@/components/dashboard/projects/ProjectsBoard";
import ProjectsEmptyState from "@/components/dashboard/projects/ProjectsEmptyState";

import CreateProjectModal from "@/components/dashboard/projects/CreateProjectModal";
import { useMobileHeaderAction } from "@/components/dashboard/MobileHeaderActionContext";
import type { ProjectSnapshot } from "@/lib/project-presenter";

// Quita acentos para que la búsqueda no dependa de tildes exactas ("panaderia" debe encontrar "Panadería").
function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

export default function ProjectsPageClient({
  projects,
  stats,
}: {
  projects: ProjectSnapshot[];
  stats: ProjectsStats;
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");

  useMobileHeaderAction(
    <button
      type="button"
      onClick={() => setIsCreateOpen(true)}
      aria-label="Nuevo proyecto"
      className="shadow-soft flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-transform duration-150 active:scale-[0.92]"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
    </button>,
  );

  const owners = useMemo(
    () => Array.from(new Set(projects.map((project) => project.owner).filter((owner): owner is string => !!owner))),
    [projects],
  );

  const filteredProjects = useMemo(() => {
    const term = normalize(search);
    return projects.filter((project) => {
      if (statusFilter && (project.kind === "RECURRING" ? project.currentPeriod?.status : project.status) !== statusFilter) return false;
      if (ownerFilter && project.owner !== ownerFilter) return false;
      if (term && !normalize(project.name).includes(term) && !normalize(project.client).includes(term)) return false;
      return true;
    });
  }, [projects, search, statusFilter, ownerFilter]);

  if (projects.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">Proyectos</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona el trabajo activo del estudio</p>
        </div>
        <ProjectsEmptyState onCreate={() => setIsCreateOpen(true)} />
        <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectsHeader
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        ownerFilter={ownerFilter}
        onOwnerFilterChange={setOwnerFilter}
        owners={owners}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      <ProjectsStatsGrid stats={stats} />

      <ProjectsBoard projects={filteredProjects} />



      <CreateProjectModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
