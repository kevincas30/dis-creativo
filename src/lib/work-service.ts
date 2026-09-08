import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { PROJECT_STATUS_CONFIG, PROJECT_STATUS_ORDER } from "@/lib/project-status";
import type { WorkspaceActor } from "@/lib/workspace-access";

export function textField(form: FormData, key: string, required = false): string | null {
  const raw = form.get(key);
  const value = typeof raw === "string" ? raw.trim() : "";
  if (value.length > 4000) throw new Error("El texto es demasiado largo.");
  if (required && !value) throw new Error(`Falta el campo ${key}.`);
  return value || null;
}
export function dateField(form: FormData, key: string, required = false): Date | null {
  const raw = textField(form, key, required);
  if (!raw) return null;
  const date = new Date(raw + "T00:00:00Z");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== raw) throw new Error("Fecha inválida.");
  return date;
}
function moneyField(form: FormData, key: string) {
  const raw = textField(form, key);
  if (raw === null) return null;
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(raw)) throw new Error("Introduce un importe positivo con un máximo de dos decimales.");
  return new Prisma.Decimal(raw);
}

// A project row lock serializes payments/configuration/period creation for this project.
export async function runWorkCommand(db: PrismaClient, actor: WorkspaceActor, projectId: string, form: FormData) {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "projects" WHERE "id" = ${projectId} AND "workspaceId" = ${actor.workspaceId} FOR UPDATE`;
    const project = await tx.project.findFirst({ where: { id: projectId, workspaceId: actor.workspaceId } });
    if (!project) throw new Error("Proyecto no encontrado o sin acceso.");
    const command = textField(form, "command", true);
    const periodId = textField(form, "periodId");
    const period = periodId ? await tx.projectPeriod.findFirst({ where: { id: periodId, projectId } }) : null;
    if (periodId && !period) throw new Error("El periodo no pertenece al proyecto.");
    const scope = period ?? project;
    const where = { projectId, periodId };
    const record = (action: string, description: string, targetPeriod = periodId) => tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, projectId, periodId: targetPeriod, clientId: project.clientId, action, description } });
    const requireScope = () => {
      if ((project.kind === "RECURRING") !== Boolean(period)) throw new Error("Selecciona un periodo para este proyecto recurrente.");
    };
    switch (command) {
      case "status": {
        requireScope();
        const status = textField(form, "status", true)!;
        if (!PROJECT_STATUS_ORDER.includes(status as never) || status === "DONE") throw new Error("Estado no válido.");
        if (scope.status === status) return;
        if (period) await tx.projectPeriod.update({ where: { id: period.id }, data: { status: status as never } });
        else await tx.project.update({ where: { id: projectId }, data: { status: status as never } });
        await record("STATUS_CHANGED", `${period ? period.label : project.name}: ${PROJECT_STATUS_CONFIG[scope.status].label} → ${PROJECT_STATUS_CONFIG[status as keyof typeof PROJECT_STATUS_CONFIG].label}`);
        return;
      }
      case "relationship": {
        if (project.kind !== "RECURRING" || period) throw new Error("Solo las relaciones recurrentes tienen este estado.");
        const status = textField(form, "status", true)!;
        if (!["ACTIVE", "PAUSED", "CLOSED", "CANCELLED"].includes(status)) throw new Error("Estado no válido.");
        if (status !== project.relationshipStatus) {
          await tx.project.update({ where: { id: projectId }, data: { relationshipStatus: status as never } });
          await record("RELATIONSHIP_CHANGED", `Relación: ${project.relationshipStatus} → ${status}`);
        }
        return;
      }
      case "createPeriod": {
        if (project.kind !== "RECURRING") throw new Error("Este proyecto es único.");
        if (["CLOSED", "CANCELLED"].includes(project.relationshipStatus)) throw new Error("Reactiva la relación antes de crear un periodo.");
        const startDate = dateField(form, "startDate", true)!;
        const sourceId = textField(form, "sourceId");
        const source = sourceId ? await tx.projectPeriod.findFirst({ where: { id: sourceId, projectId }, include: { workItems: true, assignments: true } }) : null;
        if (sourceId && !source) throw new Error("Periodo de origen no válido.");
        const copy = (key: string) => form.get(key) === "on";
        const shifted = (date: Date | null) => date && source ? new Date(date.getTime() + startDate.getTime() - source.startDate.getTime()) : null;
        const dueDate = dateField(form, "dueDate") ?? (source && copy("copyConfig") ? shifted(source.dueDate) : null);
        if (dueDate && dueDate < startDate) throw new Error("La entrega no puede ser anterior al inicio.");
        if (await tx.projectPeriod.findUnique({ where: { projectId_startDate: { projectId, startDate } } })) throw new Error("Ya existe un periodo con esa fecha de inicio.");
        const created = await tx.projectPeriod.create({ data: {
          projectId, label: textField(form, "label", true)!, startDate, dueDate,
          agreedTotal: copy("copyPrice") ? (source ?? project).agreedTotal : null,
          currency: copy("copyPrice") ? (source ?? project).currency : null,
          paymentDueDate: source && copy("copyConfig") ? shifted(source.paymentDueDate) : null,
        } });
        if (source && (copy("copyTasks") || copy("copyStructure"))) {
          const items = source.workItems.filter((item) => (copy("copyTasks") && item.recurring) || copy("copyStructure"));
          for (const item of items) await tx.workItem.create({ data: { workspaceId: actor.workspaceId, projectId, periodId: created.id, title: item.title, kind: item.kind, priority: item.priority, recurring: item.recurring, dueDate: copy("copyConfig") ? shifted(item.dueDate) : null } });
        }
        if (copy("copyTeam")) {
          const assignments = source?.assignments ?? await tx.workAssignment.findMany({ where: { projectId, periodId: null } });
          for (const assignment of assignments) await tx.workAssignment.create({ data: { projectId, periodId: created.id, userId: assignment.userId } });
        }
        await record("PERIOD_CREATED", `Periodo creado: ${created.label}${source ? ` (estructura de ${source.label})` : ""}`, created.id);
        return created.id;
      }
      case "convertRecurring": {
        if (project.kind !== "ONE_OFF") throw new Error("El proyecto ya es recurrente.");
        const startDate = dateField(form, "startDate", true)!;
        const dueDate = project.dueDate;
        if (dueDate && dueDate < startDate) throw new Error("El inicio del primer periodo no puede ser posterior a la entrega actual.");
        const created = await tx.projectPeriod.create({
          data: {
            projectId,
            label: textField(form, "label", true)!,
            startDate,
            dueDate,
            status: project.status,
            agreedTotal: project.agreedTotal,
            currency: project.currency,
            paymentDueDate: project.paymentDueDate,
          },
        });
        await tx.project.update({ where: { id: projectId }, data: { kind: "RECURRING", relationshipStatus: "ACTIVE" } });
        await tx.payment.updateMany({ where: { projectId, periodId: null }, data: { periodId: created.id } });
        await tx.workItem.updateMany({ where: { projectId, periodId: null }, data: { periodId: created.id } });
        const defaults = await tx.workAssignment.findMany({ where: { projectId, periodId: null } });
        for (const assignment of defaults) {
          await tx.workAssignment.create({ data: { projectId, periodId: created.id, userId: assignment.userId } });
        }
        await record("PROJECT_BECAME_RECURRING", `Proyecto convertido a recurrente; trabajo actual conservado en ${created.label}`, created.id);
        return created.id;
      }
      case "dates": {
        requireScope();
        const dueDate = dateField(form, "dueDate");
        if (period && dueDate && dueDate < period.startDate) throw new Error("La entrega no puede ser anterior al inicio.");
        if (period) await tx.projectPeriod.update({ where: { id: period.id }, data: { dueDate } });
        else await tx.project.update({ where: { id: projectId }, data: { dueDate } });
        await record("DELIVERY_DATE_CHANGED", `Fecha de entrega: ${dueDate?.toISOString().slice(0, 10) ?? "sin fecha"}`);
        return;
      }
      case "unassign": {
        if (actor.role !== "ADMIN") throw new Error("Solo un administrador puede retirar miembros del equipo.");
        const assignment = await tx.workAssignment.findFirst({ where: { ...where, id: textField(form, "assignmentId", true)! }, include: { user: true } });
        if (!assignment) throw new Error("Asignación no encontrada.");
        await tx.workAssignment.delete({ where: { id: assignment.id } });
        await record("TEAM_UNASSIGNED", `Miembro retirado del equipo: ${assignment.user.displayName}`);
        return;
      }
      case "finance": {
        requireScope();
        const currency = textField(form, "currency", true)!;
        if (!["MXN", "EUR"].includes(currency)) throw new Error("Moneda no válida.");
        const payments = await tx.payment.count({ where });
        if (payments && scope.currency !== currency) throw new Error("No se puede cambiar la moneda de pagos ya registrados.");
        const data = { currency: currency as "MXN" | "EUR", agreedTotal: moneyField(form, "agreedTotal"), paymentDueDate: dateField(form, "paymentDueDate") };
        if (period) await tx.projectPeriod.update({ where: { id: period.id }, data });
        else await tx.project.update({ where: { id: projectId }, data });
        await record("FINANCE_UPDATED", "Importe acordado y vencimiento de pago actualizados");
        return;
      }
      case "payment": {
        requireScope();
        if (!scope.currency) throw new Error("Define primero la moneda del acuerdo.");
        const amount = moneyField(form, "amount");
        if (!amount || amount.lte(0)) throw new Error("El pago debe ser mayor que cero.");
        const paidAt = dateField(form, "paidAt", true)!;
        if (paidAt > new Date()) throw new Error("No se puede registrar un pago futuro.");
        const requestId = textField(form, "requestId", true)!;
        const existing = await tx.payment.findUnique({ where: { requestId } });
        if (existing) {
          if (existing.projectId !== projectId || existing.periodId !== periodId || !existing.amount.equals(amount) || existing.paidAt.getTime() !== paidAt.getTime()) throw new Error("La solicitud de pago ya se utilizó.");
          return;
        }
        await tx.payment.create({ data: { ...where, requestId, amount, paidAt, currency: scope.currency, recordedById: actor.userId, note: textField(form, "note") } });
        await record("PAYMENT_RECORDED", `Pago registrado: ${amount.toFixed(2)} ${scope.currency}`);
        return;
      }
      case "addWork": {
        requireScope();
        const kind = textField(form, "kind") ?? "TASK";
        const priority = textField(form, "priority") ?? "NORMAL";
        if (!["TASK", "DELIVERABLE"].includes(kind) || !["LOW", "NORMAL", "HIGH"].includes(priority)) throw new Error("Tipo o prioridad no válidos.");
        const title = textField(form, "title", true)!;
        await tx.workItem.create({ data: { workspaceId: actor.workspaceId, ...where, title, kind: kind as never, priority: priority as never, dueDate: dateField(form, "dueDate"), recurring: form.get("recurring") === "on" } });
        await record("WORK_CREATED", `${kind === "TASK" ? "Tarea" : "Entregable"} creado: ${title}`);
        return;
      }
      case "toggleWork": {
        requireScope();
        const item = await tx.workItem.findFirst({ where: { ...where, id: textField(form, "itemId", true)! } });
        if (!item) throw new Error("Trabajo no encontrado.");
        const completed = form.get("completed") === "true";
        if (Boolean(item.completedAt) === completed) return;
        await tx.workItem.update({ where: { id: item.id }, data: { completedAt: completed ? new Date() : null } });
        await record("WORK_CHANGED", `${completed ? "Completado" : "Reabierto"}: ${item.title}`);
        return;
      }
      case "assign": {
        const userId = textField(form, "userId", true)!;
        const assignedUser = await tx.workspaceMember.findFirst({ where: { workspaceId: actor.workspaceId, userId }, include: { user: true } });
        if (!assignedUser) throw new Error("El usuario no pertenece a este workspace.");
        const existing = await tx.workAssignment.findFirst({ where: { ...where, userId } });
        if (!existing) {
          await tx.workAssignment.create({ data: { ...where, userId } });
          await record("TEAM_ASSIGNED", `Miembro asignado al equipo: ${assignedUser.user.displayName}`);
        }
        return;
      }
      case "link": {
        const clientId = textField(form, "clientId", true)!;
        const client = await tx.client.findFirst({ where: { id: clientId, workspaceId: actor.workspaceId, archivedAt: null } });
        if (!client) throw new Error("Cliente no disponible.");
        if (project.clientId && project.clientId !== clientId) throw new Error("El cliente ya está vinculado. No se reasigna su historial desde aquí.");
        const quoteId = textField(form, "quoteId");
        if (quoteId && !await tx.quote.findFirst({ where: { id: quoteId, workspaceId: actor.workspaceId, clientId } })) throw new Error("El presupuesto no corresponde a este cliente.");
        if (project.quoteId && project.quoteId !== quoteId) throw new Error("El presupuesto de origen ya está vinculado.");
        await tx.project.update({ where: { id: projectId }, data: { clientId, quoteId } });
        await tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, projectId, clientId, action: "LINK_CONFIRMED", description: "Cliente y presupuesto de origen vinculados explícitamente" } });
        return;
      }
      default: throw new Error("Acción desconocida.");
    }
  }, { timeout: 15000 });
}

export async function archiveClientRecord(db: PrismaClient, actor: WorkspaceActor, clientId: string, archived: boolean) {
  return db.$transaction(async (tx) => {
    if (actor.role !== "ADMIN") throw new Error("Solo un administrador puede archivar o restaurar clientes.");
    const client = await tx.client.findFirst({ where: { id: clientId, workspaceId: actor.workspaceId } });
    if (!client) throw new Error("Cliente no encontrado o sin acceso.");
    if (Boolean(client.archivedAt) === archived) return;
    await tx.client.update({ where: { id: clientId }, data: { archivedAt: archived ? new Date() : null } });
    await tx.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId, action: archived ? "CLIENT_ARCHIVED" : "CLIENT_RESTORED", description: archived ? "Cliente archivado; historial conservado" : "Cliente restaurado" } });
  });
}
