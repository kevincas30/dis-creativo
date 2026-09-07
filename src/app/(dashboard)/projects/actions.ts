"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeProject } from "@/lib/project-presenter";
import { PROJECT_STATUS_ORDER } from "@/lib/project-status";
import type { ProjectStatus } from "@/generated/prisma/enums";

function readTextField(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readDueDate(formData: FormData): Date | null {
  const raw = formData.get("dueDate");
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function readStatus(formData: FormData): ProjectStatus | undefined {
  const raw = formData.get("status");
  if (typeof raw !== "string") return undefined;
  return (PROJECT_STATUS_ORDER as string[]).includes(raw) ? (raw as ProjectStatus) : undefined;
}

function readProgress(formData: FormData): number | undefined {
  const raw = formData.get("progress");
  if (typeof raw !== "string" || raw.trim().length === 0) return undefined;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) return undefined;
  return Math.min(100, Math.max(0, Math.round(parsed)));
}

export async function createProject(formData: FormData) {
  const user = await getCurrentUser();

  const name = readTextField(formData, "name");
  const client = readTextField(formData, "client");
  if (!name || !client) {
    throw new Error("El nombre y el cliente son obligatorios.");
  }

  const clientId = readTextField(formData, "clientId");
  const quoteId = readTextField(formData, "quoteId");
  const kind = readTextField(formData, "kind") ?? "ONE_OFF";
  if (!["ONE_OFF", "RECURRING"].includes(kind)) throw new Error("Tipo de proyecto inválido.");
  if (clientId && !await prisma.client.findFirst({ where: { id: clientId, archivedAt: null } })) throw new Error("Cliente no disponible.");
  if (quoteId && (!clientId || !await prisma.quote.findFirst({ where: { id: quoteId, clientId, userId: user.id } }))) throw new Error("Presupuesto no válido para este cliente.");
  const project = await prisma.$transaction(async (tx) => {
    const created = await tx.project.create({
    data: {
      userId: user.id,
      clientId, quoteId, kind: kind as "ONE_OFF" | "RECURRING",
      name,
      client,
      type: readTextField(formData, "type"),
      owner: readTextField(formData, "owner"),
      description: readTextField(formData, "description"),
      dueDate: readDueDate(formData),
    },
  });

    await tx.activityRecord.create({ data: { actorId: user.id, projectId: created.id, clientId, action: "PROJECT_CREATED", description: `Proyecto creado: ${created.name}` } });
    return created;
  });

  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const user = await getCurrentUser();

  const name = readTextField(formData, "name");
  const client = readTextField(formData, "client");
  if (!name || !client) {
    throw new Error("El nombre y el cliente son obligatorios.");
  }

  const existing = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  if (existing.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  const project = await prisma.$transaction(async (tx) => {
  const updated = await tx.project.update({
    where: { id: projectId },
    data: {
      name,
      client,
      type: readTextField(formData, "type"),
      owner: readTextField(formData, "owner"),
      description: readTextField(formData, "description"),
      dueDate: readDueDate(formData),
      status: existing.kind === "RECURRING" ? existing.status : (readStatus(formData) ?? existing.status),
      progress: readProgress(formData) ?? existing.progress,
    },
  });

    if (updated.status !== existing.status) await tx.activityRecord.create({ data: { actorId: user.id, projectId, clientId: existing.clientId, action: "STATUS_CHANGED", description: `${existing.status} → ${updated.status}` } });
    return updated;
  });
  revalidatePath("/");
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);

  return serializeProject(project);
}

export async function deleteProject(projectId: string) {
  const user = await getCurrentUser();

  const existing = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
  if (existing.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  const references = await prisma.project.findUniqueOrThrow({ where: { id: projectId }, include: { _count: { select: { events: true, periods: true, payments: true, workItems: true, assignments: true, activityRecords: true } } } });
  if (Object.values(references._count).some(Boolean) || references.clientId || references.quoteId) throw new Error("Este proyecto tiene historial o relaciones. Ciérralo o cancélalo para conservar sus datos.");
  await prisma.project.delete({ where: { id: projectId } });

  revalidatePath("/");
  revalidatePath("/projects");
  redirect("/projects");
}
