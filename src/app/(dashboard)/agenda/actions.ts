"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { serializeEvent } from "@/lib/event-presenter";
import { EVENT_TYPE_ORDER } from "@/lib/event-type";
import type { EventType } from "@/generated/prisma/enums";

function readText(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readType(formData: FormData): EventType {
  const raw = formData.get("type");
  if (typeof raw === "string" && (EVENT_TYPE_ORDER as string[]).includes(raw)) return raw as EventType;
  return "MEETING";
}

const EVENT_SELECT = {
  id: true,
  title: true,
  type: true,
  startAt: true,
  endAt: true,
  location: true,
  notes: true,
  clientId: true,
  projectId: true,
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
} as const;

export async function createEvent(formData: FormData) {
  const context = await requireWorkspaceMembership();
  const { user, workspace } = context;

  const title = readText(formData, "title");
  const date = readText(formData, "date");
  const startTime = readText(formData, "startTime");
  const endTime = readText(formData, "endTime");
  if (!title || !date || !startTime || !endTime) {
    throw new Error("Título, fecha, hora de inicio y hora de fin son obligatorios.");
  }

  const startAt = new Date(`${date}T${startTime}`);
  const endAt = new Date(`${date}T${endTime}`);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Fecha u hora inválida.");
  }

  let clientId = readText(formData, "clientId");
  const projectId = readText(formData, "projectId");

  const periodId = readText(formData, "periodId");
  if (endAt <= startAt) throw new Error("La hora final debe ser posterior al inicio.");
  const project = projectId ? await prisma.project.findFirst({ where: { id: projectId, workspaceId: workspace.id } }) : null;
  if (projectId && !project) throw new Error("Proyecto no disponible.");
  if (project?.clientId) {
    if (clientId && clientId !== project.clientId) throw new Error("El cliente no corresponde al proyecto.");
    clientId = project.clientId;
  }
  if (clientId && !await prisma.client.findFirst({ where: { id: clientId, workspaceId: workspace.id, archivedAt: null } })) throw new Error("Cliente no disponible.");
  if (periodId && (!project || !await prisma.projectPeriod.findFirst({ where: { id: periodId, projectId: project.id } }))) throw new Error("Periodo no válido para este proyecto.");
  const event = await prisma.$transaction(async (tx) => {
  const created = await tx.event.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      title,
      type: readType(formData),
      startAt,
      endAt,
      location: readText(formData, "location"),
      notes: readText(formData, "notes"),
      clientId,
      projectId,
      periodId,
    },
    select: EVENT_SELECT,
  });
  await tx.activityRecord.create({ data: { workspaceId: workspace.id, actorId: user.id, clientId, projectId, periodId, action: "EVENT_CREATED", description: `Evento agendado: ${title}` } });
  return created;
  });

  revalidatePath("/", "layout");
  revalidatePath("/agenda");

  return serializeEvent(event);
}
