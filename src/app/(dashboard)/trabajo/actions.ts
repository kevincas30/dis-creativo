"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership, workspaceActor } from "@/lib/workspace-access";
import { addTaskComment, createTask, deleteTaskComment, editTaskComment, transitionTask, updateTask, type TaskInput } from "@/lib/task-service";
function result<T>(run: () => Promise<T>) { return run().then(data => ({ data, error: null as string | null })).catch(error => ({ data: null, error: error instanceof Error && !("code" in error) ? error.message : "No se pudo guardar. Inténtalo de nuevo." })); }
export async function createWorkTask(input: TaskInput) { return result(async () => { const context = await requireWorkspaceMembership(); const task = await createTask(prisma, workspaceActor(context), input); revalidatePath("/", "layout"); return { id: task.id }; }); }
export async function updateWorkTask(id: string, input: TaskInput) { return result(async () => { const context = await requireWorkspaceMembership(); const task = await updateTask(prisma, workspaceActor(context), id, input); revalidatePath("/", "layout"); return { id: task.id }; }); }
export async function transitionWorkTask(id: string, action: "START" | "COMPLETE" | "SEND_REVIEW" | "APPROVE" | "REQUEST_CHANGES", comment?: string) { return result(async () => { const context = await requireWorkspaceMembership(); await transitionTask(prisma, workspaceActor(context), id, action, comment); revalidatePath("/", "layout"); return { id }; }); }
export async function addWorkTaskComment(id: string, content: string) { return result(async () => { const context = await requireWorkspaceMembership(); const comment = await addTaskComment(prisma, workspaceActor(context), id, content); revalidatePath("/", "layout"); return { id: comment.id }; }); }
export async function editWorkTaskComment(id: string, content: string) { return result(async () => { const context = await requireWorkspaceMembership(); await editTaskComment(prisma, workspaceActor(context), id, content); revalidatePath("/", "layout"); return { id }; }); }
export async function deleteWorkTaskComment(id: string) { return result(async () => { const context = await requireWorkspaceMembership(); await deleteTaskComment(prisma, workspaceActor(context), id); revalidatePath("/", "layout"); return { id }; }); }
