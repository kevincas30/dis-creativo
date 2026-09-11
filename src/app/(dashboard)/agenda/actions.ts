"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership, workspaceActor } from "@/lib/workspace-access";
import { serializeEvent } from "@/lib/event-presenter";
import { EVENT_TYPE_ORDER } from "@/lib/event-type";
import { allDayRange, isTime, madridDateTime, madridTime } from "@/lib/agenda-time";
import { updateTask } from "@/lib/task-service";
import type { EventType } from "@/generated/prisma/enums";

function readText(formData: FormData, key: string): string | null { const raw = formData.get(key); return typeof raw === "string" && raw.trim() ? raw.trim() : null; }
function readType(formData: FormData): EventType { const value = readText(formData, "type"); return value && (EVENT_TYPE_ORDER as string[]).includes(value) ? value as EventType : "MEETING"; }
function readAllDay(formData: FormData) { return formData.get("allDay") === "on"; }
function validateDate(value: string | null) { if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("La fecha no es válida."); return value; }

const EVENT_SELECT = { id: true, title: true, type: true, startAt: true, endAt: true, allDay: true, location: true, notes: true, clientId: true, projectId: true, quoteId: true, periodId: true, responsibleId: true, responsible: { select: { id: true, displayName: true } }, client: { select: { id: true, name: true } }, project: { select: { id: true, name: true } } } as const;

async function eventData(formData: FormData, workspaceId: string) {
  const title = readText(formData, "title"); const date = validateDate(readText(formData, "date")); const allDay = readAllDay(formData);
  const startTime = readText(formData, "startTime") ?? "09:00"; const endTime = readText(formData, "endTime") ?? "09:30";
  if (!title) throw new Error("El título es obligatorio."); if (!allDay && (!isTime(startTime) || !isTime(endTime))) throw new Error("La hora no es válida.");
  const range = allDay ? allDayRange(date) : { startAt: madridDateTime(date, startTime), endAt: madridDateTime(date, endTime) };
  if (range.endAt <= range.startAt) throw new Error("La hora final debe ser posterior al inicio.");
  let clientId = readText(formData, "clientId"); const projectId = readText(formData, "projectId"); const quoteId = readText(formData, "quoteId"); const periodId = readText(formData, "periodId"); const responsibleId = readText(formData, "responsibleId");
  const [project, client, quote, period, responsible] = await Promise.all([
    projectId ? prisma.project.findFirst({ where: { id: projectId, workspaceId, archivedAt: null } }) : null,
    clientId ? prisma.client.findFirst({ where: { id: clientId, workspaceId, archivedAt: null } }) : null,
    quoteId ? prisma.quote.findFirst({ where: { id: quoteId, workspaceId } }) : null,
    periodId ? prisma.projectPeriod.findFirst({ where: { id: periodId, project: { workspaceId, archivedAt: null } } }) : null,
    responsibleId ? prisma.workspaceMember.findFirst({ where: { workspaceId, userId: responsibleId } }) : null,
  ]);
  if (projectId && !project) throw new Error("Proyecto no disponible."); if (clientId && !client) throw new Error("Cliente no disponible."); if (quoteId && !quote) throw new Error("Presupuesto no disponible."); if (periodId && !period) throw new Error("Periodo no disponible."); if (responsibleId && !responsible) throw new Error("La persona responsable no pertenece al workspace actual.");
  if (project?.clientId) { if (clientId && clientId !== project.clientId) throw new Error("El cliente no corresponde al proyecto."); clientId = project.clientId; }
  if (period && projectId && period.projectId !== projectId) throw new Error("El periodo no corresponde al proyecto.");
  if (period && !projectId) throw new Error("Selecciona el proyecto del periodo.");
  if (quote?.clientId) { if (clientId && clientId !== quote.clientId) throw new Error("El cliente no corresponde al presupuesto."); clientId = quote.clientId; }
  if (readType(formData) === "FOLLOW_UP" && !clientId) throw new Error("Selecciona el prospecto o cliente para el seguimiento.");
  return { title, type: readType(formData), startAt: range.startAt, endAt: range.endAt, allDay, location: readText(formData, "location"), notes: readText(formData, "notes"), clientId, projectId, quoteId, periodId, responsibleId };
}

async function resolveResponsible(workspaceId: string, requested: string | null, fallback: string) {
  if (requested) return requested;
  const members = await prisma.workspaceMember.findMany({ where: { workspaceId }, select: { userId: true }, take: 2 });
  return members.length === 1 ? members[0]!.userId : fallback;
}

export async function createEvent(formData: FormData) {
  const context = await requireWorkspaceMembership(); const { user, workspace } = context; const data = await eventData(formData, workspace.id); const responsibleId = await resolveResponsible(workspace.id, data.responsibleId, user.id);
  const event = await prisma.$transaction(async (tx) => {
    const followUp = data.type === "FOLLOW_UP" && data.clientId ? await tx.client.findFirst({ where: { id: data.clientId, workspaceId: workspace.id }, select: { nextFollowUpEventId: true } }) : null;
    const saved = followUp?.nextFollowUpEventId ? await tx.event.update({ where: { id: followUp.nextFollowUpEventId }, data: { ...data, responsibleId }, select: EVENT_SELECT }) : await tx.event.create({ data: { ...data, responsibleId, userId: user.id, workspaceId: workspace.id }, select: EVENT_SELECT });
    if (data.type === "FOLLOW_UP" && data.clientId && !followUp?.nextFollowUpEventId) await tx.client.update({ where: { id: data.clientId }, data: { nextFollowUpEventId: saved.id } });
    await tx.activityRecord.create({ data: { workspaceId: workspace.id, actorId: user.id, clientId: data.clientId, projectId: data.projectId, periodId: data.periodId, action: data.type === "FOLLOW_UP" ? "FOLLOW_UP_SCHEDULED" : "EVENT_CREATED", description: `${data.type === "FOLLOW_UP" ? "Seguimiento" : "Evento"} agendado: ${data.title}` } });
    return saved;
  });
  revalidatePath("/", "layout"); return serializeEvent(event);
}

export async function updateEvent(id: string, formData: FormData) {
  const context = await requireWorkspaceMembership(); const existing = await prisma.event.findFirst({ where: { id, workspaceId: context.workspace.id }, select: { id: true, userId: true } }); if (!existing) throw new Error("Evento no encontrado o sin acceso.");
  const data = await eventData(formData, context.workspace.id); const responsibleId = await resolveResponsible(context.workspace.id, data.responsibleId, existing.userId);
  const event = await prisma.event.update({ where: { id }, data: { ...data, responsibleId }, select: EVENT_SELECT }); revalidatePath("/", "layout"); return serializeEvent(event);
}

export async function moveAgendaItem(input: { kind: "TASK_START" | "TASK_DUE" | "EVENT" | "PROJECT_START" | "PROJECT_DUE"; id: string; periodId?: string | null; date: string }) {
  const context = await requireWorkspaceMembership(); const date = validateDate(input.date);
  if (input.kind === "EVENT") { const event = await prisma.event.findFirst({ where: { id: input.id, workspaceId: context.workspace.id } }); if (!event) throw new Error("Evento no encontrado o sin acceso."); const duration = event.endAt.getTime() - event.startAt.getTime(); const startAt = event.allDay ? allDayRange(date).startAt : madridDateTime(date, madridTime(event.startAt)); const endAt = event.allDay ? allDayRange(date).endAt : new Date(startAt.getTime() + duration); await prisma.event.update({ where: { id: event.id }, data: { startAt, endAt } }); }
  else if (input.kind === "TASK_START" || input.kind === "TASK_DUE") { const task = await prisma.workItem.findFirst({ where: { id: input.id, workspaceId: context.workspace.id, archivedAt: null } }); if (!task) throw new Error("Tarea no encontrada o sin acceso."); await updateTask(prisma, workspaceActor(context), task.id, { title: task.title, description: task.description, responsibleId: task.responsibleId, projectId: task.projectId, periodId: task.periodId, startDate: input.kind === "TASK_START" ? date : task.startDate?.toISOString().slice(0, 10) ?? null, startTime: task.startTime, dueDate: input.kind === "TASK_DUE" ? date : task.dueDate?.toISOString().slice(0, 10) ?? null, dueTime: task.dueTime, needsReview: task.needsReview }); }
  else { const project = await prisma.project.findFirst({ where: { id: input.id, workspaceId: context.workspace.id, archivedAt: null } }); if (!project) throw new Error("Proyecto no encontrado o sin acceso."); const data = input.kind === "PROJECT_START" ? { startDate: new Date(`${date}T00:00:00.000Z`) } : { dueDate: new Date(`${date}T00:00:00.000Z`) }; if (input.periodId) { const period = await prisma.projectPeriod.findFirst({ where: { id: input.periodId, projectId: project.id } }); if (!period) throw new Error("Periodo no encontrado o sin acceso."); await prisma.projectPeriod.update({ where: { id: period.id }, data }); } else await prisma.project.update({ where: { id: project.id }, data }); }
  revalidatePath("/", "layout");
}

export async function deleteAgendaEvent(id: string) { const context = await requireWorkspaceMembership(); if (context.membership.role !== "ADMIN") throw new Error("Solo un administrador puede eliminar eventos."); const event = await prisma.event.findFirst({ where: { id, workspaceId: context.workspace.id }, select: { id: true, clientId: true } }); if (!event) throw new Error("Evento no encontrado o sin acceso."); await prisma.$transaction(async tx => { if (event.clientId) await tx.client.updateMany({ where: { id: event.clientId, nextFollowUpEventId: event.id }, data: { nextFollowUpEventId: null } }); await tx.event.delete({ where: { id } }); }); revalidatePath("/", "layout"); }
