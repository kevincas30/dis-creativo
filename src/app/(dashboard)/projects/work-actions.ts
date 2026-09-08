"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership, workspaceActor } from "@/lib/workspace-access";
import { runWorkCommand } from "@/lib/work-service";

export async function workAction(projectId: string, form: FormData) {
  try {
    const context = await requireWorkspaceMembership();
    const periodId = await runWorkCommand(prisma, workspaceActor(context), projectId, form);
    revalidatePath("/", "layout");
    return { periodId: periodId ?? null, error: null };
  } catch (error) {
    return { periodId: null, error: error instanceof Error && !('code' in error) ? error.message : "No se pudo guardar. Revisa los datos e inténtalo de nuevo." };
  }
}

export async function getProjectOptions() {
  const context = await requireWorkspaceMembership();
  const [clients, quotes] = await Promise.all([
    prisma.client.findMany({ where: { workspaceId: context.workspace.id, archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({ where: { workspaceId: context.workspace.id, clientId: { not: null } }, select: { id: true, clientId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return { clients, quotes: quotes.map((quote) => ({ ...quote, createdAt: quote.createdAt.toISOString() })) };
}
