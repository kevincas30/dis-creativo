import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import type { WorkspaceActor } from "@/lib/workspace-access";

export type PreparedTaskInput = {
  title: string;
  responsibleId?: string | null;
  dueDate?: string | null;
  needsReview?: boolean;
};

export type ProjectPreparationInput = {
  quoteId: string;
  name: string;
  kind: "ONE_OFF" | "RECURRING";
  startDate: string | null;
  dueDate: string | null;
  agreedTotal: string;
  depositExpected: string;
  responsibleId: string;
  tasks: PreparedTaskInput[];
};

function date(value: string | null, label: string) {
  if (!value) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error(`${label} no es válida.`);
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`${label} no es válida.`);
  return parsed;
}
function amount(value: string, label: string) {
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(value) || new Prisma.Decimal(value).lt(0)) throw new Error(`${label} no es válido.`);
  return new Prisma.Decimal(value);
}
function text(value: string, label: string) {
  const result = value.trim();
  if (!result) throw new Error(`${label} es obligatorio.`);
  if (result.length > 300) throw new Error(`${label} es demasiado largo.`);
  return result;
}

/** Creates a project only after the reviewed preparation is explicitly confirmed. */
export async function prepareProjectFromQuote(db: PrismaClient, actor: WorkspaceActor, raw: ProjectPreparationInput) {
  const name = text(raw.name, "El nombre del proyecto");
  if (!raw.quoteId) throw new Error("Falta el presupuesto aprobado.");
  if (!raw.responsibleId) throw new Error("Selecciona una persona responsable.");
  if (!['ONE_OFF', 'RECURRING'].includes(raw.kind)) throw new Error("El tipo de proyecto no es válido.");
  const startDate = date(raw.startDate, "La fecha de inicio");
  const dueDate = date(raw.dueDate, "La fecha estimada de entrega");
  if (startDate && dueDate && dueDate < startDate) throw new Error("La entrega no puede ser anterior al inicio.");
  const agreedTotal = amount(raw.agreedTotal, "El importe total");
  const depositExpected = amount(raw.depositExpected, "El anticipo esperado");
  if (depositExpected.gt(agreedTotal)) throw new Error("El anticipo no puede superar el importe total.");
  const tasks = raw.tasks.map((task, index) => ({ ...task, title: text(task.title, `La tarea ${index + 1}`), dueDate: date(task.dueDate ?? null, `La fecha de la tarea ${index + 1}`) }));

  return db.$transaction(async (tx) => {
    // Serialises competing confirmations of one approved quote.
    await tx.$queryRaw`SELECT "id" FROM "quotes" WHERE "id" = ${raw.quoteId} AND "workspaceId" = ${actor.workspaceId} FOR UPDATE`;
    const quote = await tx.quote.findFirst({
      where: { id: raw.quoteId, workspaceId: actor.workspaceId },
      include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } }, projects: { select: { id: true } } },
    });
    if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");
    if (quote.status !== "ACCEPTED") throw new Error("Solo se puede preparar un proyecto desde un presupuesto aprobado.");
    if (!quote.clientId || !quote.client) throw new Error("El presupuesto aprobado necesita un cliente vinculado.");
    const existing = quote.projects[0];
    if (existing) return { id: existing.id, created: false };
    const responsible = await tx.workspaceMember.findFirst({ where: { workspaceId: actor.workspaceId, userId: raw.responsibleId }, select: { userId: true } });
    if (!responsible) throw new Error("La persona responsable no pertenece al workspace actual.");
    for (const task of tasks) {
      if (!task.responsibleId) continue;
      const member = await tx.workspaceMember.findFirst({ where: { workspaceId: actor.workspaceId, userId: task.responsibleId }, select: { userId: true } });
      if (!member) throw new Error("Una persona asignada a una tarea no pertenece al workspace actual.");
    }

    const created = await tx.project.create({ data: {
      workspaceId: actor.workspaceId, userId: actor.userId, clientId: quote.clientId, quoteId: quote.id,
      name, client: quote.client.name, kind: raw.kind, status: "NOT_STARTED", relationshipStatus: "ACTIVE",
      owner: null, responsibleId: raw.responsibleId, startDate, dueDate, agreedTotal, depositExpected, currency: quote.currency,
    } });
    const period = raw.kind === "RECURRING" ? await tx.projectPeriod.create({ data: {
      projectId: created.id, label: startDate ? startDate.toLocaleDateString("es", { month: "long", year: "numeric", timeZone: "UTC" }) : "Periodo inicial",
      startDate: startDate ?? new Date(), dueDate, agreedTotal, depositExpected, currency: quote.currency,
    } }) : null;
    if (tasks.length) await tx.workItem.createMany({ data: tasks.map((task) => ({
      workspaceId: actor.workspaceId, projectId: created.id, periodId: period?.id ?? null, title: task.title,
      dueDate: task.dueDate, responsibleId: task.responsibleId ?? raw.responsibleId, needsReview: Boolean(task.needsReview),
    })) });
    await tx.workAssignment.create({ data: { projectId: created.id, periodId: period?.id ?? null, userId: raw.responsibleId } });
    await tx.activityRecord.create({ data: {
      workspaceId: actor.workspaceId, actorId: actor.userId, projectId: created.id, periodId: period?.id ?? null, clientId: quote.clientId,
      action: "PROJECT_PREPARED", description: `Proyecto preparado desde el presupuesto ${quote.id.slice(0, 8)}: ${created.name}`,
    } });
    return { id: created.id, created: true };
  }, { timeout: 30_000, maxWait: 10_000 });
}

export function proposedTasksFromQuote(lines: Array<{ description: string }>) {
  return lines.filter((line) => line.description.trim()).map((line) => ({ title: line.description, needsReview: true }));
}
