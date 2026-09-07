"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { runWorkCommand } from "@/lib/work-service";

export async function workAction(projectId: string, form: FormData) {
  try {
    const user = await getCurrentUser();
    const periodId = await runWorkCommand(prisma, user.id, projectId, form);
    revalidatePath("/", "layout");
    return { periodId: periodId ?? null, error: null };
  } catch (error) {
    return { periodId: null, error: error instanceof Error && !('code' in error) ? error.message : "No se pudo guardar. Revisa los datos e inténtalo de nuevo." };
  }
}

export async function getProjectOptions() {
  const user = await getCurrentUser();
  const [clients, quotes] = await Promise.all([
    prisma.client.findMany({ where: { archivedAt: null }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.quote.findMany({ where: { userId: user.id, clientId: { not: null } }, select: { id: true, clientId: true, createdAt: true }, orderBy: { createdAt: "desc" } }),
  ]);
  return { clients, quotes: quotes.map((quote) => ({ ...quote, createdAt: quote.createdAt.toISOString() })) };
}
