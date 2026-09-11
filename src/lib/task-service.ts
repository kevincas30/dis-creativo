import type { PrismaClient } from "@/generated/prisma/client";
import type { TaskStatus } from "@/generated/prisma/enums";
import type { WorkspaceActor } from "@/lib/workspace-access";

export type TaskInput = { title: string; description?: string | null; responsibleId?: string | null; projectId?: string | null; periodId?: string | null; startDate?: string | null; dueDate?: string | null; needsReview?: boolean };
function value(input: string | null | undefined, label: string, required = false) { const result = input?.trim() ?? ""; if (required && !result) throw new Error(`${label} es obligatorio.`); if (result.length > 4000) throw new Error(`${label} es demasiado largo.`); return result || null; }
function date(input: string | null | undefined, label: string) { const raw = value(input, label); if (!raw) return null; if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) throw new Error(`${label} no es válida.`); const result = new Date(`${raw}T00:00:00.000Z`); if (Number.isNaN(result.getTime()) || result.toISOString().slice(0, 10) !== raw) throw new Error(`${label} no es válida.`); return result; }
async function member(tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0], workspaceId: string, userId: string) { return tx.workspaceMember.findFirst({ where: { workspaceId, userId }, select: { userId: true } }); }
async function scopedTask(tx: Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0], actor: WorkspaceActor, id: string) { const task = await tx.workItem.findFirst({ where: { id, workspaceId: actor.workspaceId, kind: "TASK", archivedAt: null }, include: { project: true, period: true } }); if (!task) throw new Error("Tarea no encontrada o sin acceso."); return task; }

export async function createTask(db: PrismaClient, actor: WorkspaceActor, input: TaskInput) {
 const title = value(input.title, "El título", true)!; const startDate = date(input.startDate, "La fecha de inicio"); const dueDate = date(input.dueDate, "La fecha de entrega"); if (startDate && dueDate && dueDate < startDate) throw new Error("La entrega no puede ser anterior al inicio.");
 return db.$transaction(async tx => {
   const members = await tx.workspaceMember.findMany({ where: { workspaceId: actor.workspaceId }, select: { userId: true } });
   const responsibleId = input.responsibleId || (members.length === 1 ? members[0]!.userId : actor.userId);
   if (!await member(tx, actor.workspaceId, responsibleId)) throw new Error("La persona responsable no pertenece al workspace actual.");
   const projectId = input.projectId || null; const periodId = input.periodId || null;
   if (projectId && !await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, archivedAt: null } })) throw new Error("El proyecto no pertenece al workspace actual.");
   if (periodId && (!projectId || !await tx.projectPeriod.findFirst({ where: { id: periodId, projectId } }))) throw new Error("El periodo no pertenece al proyecto seleccionado.");
   const task = await tx.workItem.create({ data: { workspaceId: actor.workspaceId, createdById: actor.userId, responsibleId, projectId, periodId, title, description: value(input.description, "La descripción"), startDate, dueDate, needsReview: Boolean(input.needsReview), kind: "TASK", status: "PENDING" } });
   await tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, workItemId: task.id, projectId, periodId, action: "TASK_CREATED", description: `Tarea creada: ${task.title}` } });
   return task;
 }, { timeout: 30_000, maxWait: 10_000 });
}

export async function updateTask(db: PrismaClient, actor: WorkspaceActor, id: string, input: TaskInput) {
 const title = value(input.title, "El título", true)!; const startDate = date(input.startDate, "La fecha de inicio"); const dueDate = date(input.dueDate, "La fecha de entrega"); if (startDate && dueDate && dueDate < startDate) throw new Error("La entrega no puede ser anterior al inicio.");
 return db.$transaction(async tx => { const current = await scopedTask(tx, actor, id); const responsibleId = input.responsibleId || current.responsibleId || actor.userId; if (!await member(tx, actor.workspaceId, responsibleId)) throw new Error("La persona responsable no pertenece al workspace actual."); const projectId = input.projectId || null; const periodId = input.periodId || null; if (projectId && !await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId, archivedAt: null } })) throw new Error("El proyecto no pertenece al workspace actual."); if (periodId && (!projectId || !await tx.projectPeriod.findFirst({ where: { id: periodId, projectId } }))) throw new Error("El periodo no pertenece al proyecto seleccionado."); const updated = await tx.workItem.update({ where: { id }, data: { title, description: value(input.description, "La descripción"), responsibleId, projectId, periodId, startDate, dueDate, needsReview: Boolean(input.needsReview) } }); await tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, workItemId: id, projectId, periodId, action: "TASK_UPDATED", description: `Tarea actualizada: ${updated.title}` } }); return updated; }, { timeout: 30_000, maxWait: 10_000 });
}

export async function transitionTask(db: PrismaClient, actor: WorkspaceActor, id: string, action: "START" | "COMPLETE" | "SEND_REVIEW" | "APPROVE" | "REQUEST_CHANGES", comment?: string | null) {
 return db.$transaction(async tx => { const task = await scopedTask(tx, actor, id); let next: TaskStatus; let label: string;
   if (action === "START" && ["PENDING", "IN_PROGRESS"].includes(task.status)) { next = "IN_PROGRESS"; label = "Tarea iniciada"; }
   else if (action === "COMPLETE" && !task.needsReview && ["PENDING", "IN_PROGRESS"].includes(task.status)) { next = "COMPLETED"; label = "Tarea completada"; }
   else if (action === "SEND_REVIEW" && task.needsReview && ["PENDING", "IN_PROGRESS"].includes(task.status)) { next = "IN_REVIEW"; label = "Tarea enviada a revisión"; }
   else if (action === "APPROVE" && task.status === "IN_REVIEW") { next = "COMPLETED"; label = "Revisión aprobada"; }
   else if (action === "REQUEST_CHANGES" && task.status === "IN_REVIEW") { const content = value(comment, "El comentario de corrección", true)!; await tx.taskComment.create({ data: { workItemId: id, authorId: actor.userId, content } }); next = "IN_PROGRESS"; label = "Cambios solicitados"; }
   else throw new Error("Esta transición no está disponible para la tarea.");
   await tx.workItem.update({ where: { id }, data: { status: next, completedAt: next === "COMPLETED" ? new Date() : null } });
   await tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, workItemId: id, projectId: task.projectId, periodId: task.periodId, action: "TASK_STATUS_CHANGED", description: `${label}: ${task.title}` } });
 }, { timeout: 30_000, maxWait: 10_000 });
}

export async function addTaskComment(db: PrismaClient, actor: WorkspaceActor, id: string, content: string) { return db.$transaction(async tx => { await scopedTask(tx, actor, id); return tx.taskComment.create({ data: { workItemId: id, authorId: actor.userId, content: value(content, "El comentario", true)! }, include: { author: { select: { displayName: true } } } }); }); }
export async function editTaskComment(db: PrismaClient, actor: WorkspaceActor, commentId: string, content: string) { return db.$transaction(async tx => { const comment = await tx.taskComment.findFirst({ where: { id: commentId, workItem: { workspaceId: actor.workspaceId, archivedAt: null } } }); if (!comment) throw new Error("Comentario no encontrado o sin acceso."); if (comment.authorId !== actor.userId && actor.role !== "ADMIN") throw new Error("Solo puedes editar tus propios comentarios."); return tx.taskComment.update({ where: { id: commentId }, data: { content: value(content, "El comentario", true)! } }); }); }
export async function deleteTaskComment(db: PrismaClient, actor: WorkspaceActor, commentId: string) { return db.$transaction(async tx => { const comment = await tx.taskComment.findFirst({ where: { id: commentId, workItem: { workspaceId: actor.workspaceId, archivedAt: null } } }); if (!comment) throw new Error("Comentario no encontrado o sin acceso."); if (comment.authorId !== actor.userId && actor.role !== "ADMIN") throw new Error("Solo puedes eliminar tus propios comentarios."); await tx.taskComment.delete({ where: { id: commentId } }); }); }
