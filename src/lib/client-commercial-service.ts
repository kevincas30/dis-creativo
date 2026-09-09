import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { ClientStage, LeadSource, ProspectStatus } from "@/generated/prisma/enums";
import type { WorkspaceActor } from "@/lib/workspace-access";

type ClientTransaction = Prisma.TransactionClient;

export type ClientCommercialInput = {
  stage: ClientStage;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  country?: string | null;
  address?: string | null;
  website?: string | null;
  notes?: string | null;
  source?: LeadSource | null;
  prospectStatus?: ProspectStatus;
  responsibleId?: string | null;
  followUp?: { date: Date; time?: string | null; title?: string | null } | null;
};

export type ClientDuplicate = { id: string; name: string; stage: ClientStage; email: string | null; phone: string | null; instagram: string | null };

function compact(value: string | null | undefined) {
  return value?.trim() || null;
}

export function normalizeEmail(value: string | null | undefined) {
  return compact(value)?.toLocaleLowerCase() ?? null;
}

export function normalizePhone(value: string | null | undefined) {
  const digits = compact(value)?.replace(/\D/g, "") ?? "";
  return digits || null;
}

export function normalizeInstagram(value: string | null | undefined) {
  const normalized = compact(value)?.replace(/^@+/, "").toLocaleLowerCase() ?? "";
  return normalized || null;
}

function firstAndLastName(name: string) {
  const parts = name.trim().split(/\s+/);
  return { firstName: parts[0] ?? null, lastName: parts.length > 1 ? parts.slice(1).join(" ") : null };
}

function followUpTimes(date: Date, time?: string | null) {
  const startAt = new Date(date);
  const [hours, minutes] = (time ?? "09:00").split(":").map(Number);
  startAt.setHours(hours, minutes, 0, 0);
  const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
  return { startAt, endAt };
}

async function requireResponsible(transaction: ClientTransaction, actor: WorkspaceActor, requestedId?: string | null) {
  if (requestedId) {
    const member = await transaction.workspaceMember.findFirst({ where: { workspaceId: actor.workspaceId, userId: requestedId }, select: { userId: true } });
    if (!member) throw new Error("La persona responsable no pertenece al workspace actual.");
    return member.userId;
  }

  const members = await transaction.workspaceMember.findMany({ where: { workspaceId: actor.workspaceId }, select: { userId: true }, take: 2 });
  if (members.length === 1) return members[0].userId;
  throw new Error("Selecciona una persona responsable.");
}

export function validateClientCommercialInput(input: ClientCommercialInput) {
  const name = compact(input.name);
  const email = compact(input.email);
  const phone = compact(input.phone);
  const instagram = compact(input.instagram);
  if (!name) throw new Error("El nombre es obligatorio.");
  if (name.length > 200) throw new Error("El nombre es demasiado largo.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El email no tiene un formato válido.");
  if (input.stage === "PROSPECT" && !email && !phone && !instagram) {
    throw new Error("Un prospecto necesita email, teléfono/WhatsApp o Instagram.");
  }
  if (input.followUp && Number.isNaN(input.followUp.date.getTime())) throw new Error("La fecha del seguimiento no es válida.");
  if (input.followUp?.time && !/^\d{2}:\d{2}$/.test(input.followUp.time)) throw new Error("La hora del seguimiento no es válida.");
  return { ...input, name, email, phone, instagram };
}

export async function findClientDuplicates(
  database: Pick<PrismaClient, "client"> | ClientTransaction,
  workspaceId: string,
  contact: Pick<ClientCommercialInput, "email" | "phone" | "instagram">,
  excludeId?: string,
): Promise<ClientDuplicate[]> {
  const emailNormalized = normalizeEmail(contact.email);
  const phoneNormalized = normalizePhone(contact.phone);
  const instagramNormalized = normalizeInstagram(contact.instagram);
  const matches = [
    ...(emailNormalized ? [{ emailNormalized }] : []),
    ...(phoneNormalized ? [{ phoneNormalized }] : []),
    ...(instagramNormalized ? [{ instagramNormalized }] : []),
  ];
  if (matches.length === 0) return [];
  return database.client.findMany({
    where: { workspaceId, archivedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}), OR: matches },
    select: { id: true, name: true, stage: true, email: true, phone: true, instagram: true },
    orderBy: { updatedAt: "desc" },
    take: 5,
  });
}

async function scheduleFollowUp(transaction: ClientTransaction, actor: WorkspaceActor, client: { id: string; name: string; nextFollowUpEventId: string | null }, followUp: ClientCommercialInput["followUp"]) {
  if (!followUp) return null;
  const { startAt, endAt } = followUpTimes(followUp.date, followUp.time);
  const title = compact(followUp.title) ?? `Seguimiento: ${client.name}`;
  const data = { title, type: "FOLLOW_UP" as const, startAt, endAt, clientId: client.id };
  const event = client.nextFollowUpEventId
    ? await transaction.event.update({ where: { id: client.nextFollowUpEventId }, data })
    : await transaction.event.create({ data: { ...data, workspaceId: actor.workspaceId, userId: actor.userId } });
  if (!client.nextFollowUpEventId) {
    await transaction.client.update({ where: { id: client.id }, data: { nextFollowUpEventId: event.id } });
  }
  await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: client.id, action: "FOLLOW_UP_SCHEDULED", description: `Seguimiento programado: ${title}` } });
  return event;
}

export async function createCommercialClient(database: PrismaClient, actor: WorkspaceActor, rawInput: ClientCommercialInput) {
  const input = validateClientCommercialInput(rawInput);
  return database.$transaction(async (transaction) => {
    const responsibleId = await requireResponsible(transaction, actor, input.responsibleId);
    const names = firstAndLastName(input.name);
    const client = await transaction.client.create({
      data: {
        workspaceId: actor.workspaceId,
        name: input.name,
        ...names,
        company: compact(input.company), email: input.email, phone: input.phone, instagram: input.instagram,
        emailNormalized: normalizeEmail(input.email), phoneNormalized: normalizePhone(input.phone), instagramNormalized: normalizeInstagram(input.instagram),
        country: compact(input.country), address: compact(input.address), website: compact(input.website), notes: compact(input.notes),
        source: input.source ?? null, stage: input.stage, prospectStatus: input.prospectStatus ?? (input.stage === "PROSPECT" ? "NEW" : "WON"), responsibleId,
      },
    });
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: client.id, action: input.stage === "PROSPECT" ? "PROSPECT_CREATED" : "CLIENT_CREATED", description: `${input.stage === "PROSPECT" ? "Prospecto" : "Cliente"} creado: ${client.name}` } });
    await scheduleFollowUp(transaction, actor, client, input.followUp);
    return client;
  });
}

export async function updateCommercialClient(database: PrismaClient, actor: WorkspaceActor, clientId: string, rawInput: ClientCommercialInput) {
  const input = validateClientCommercialInput(rawInput);
  return database.$transaction(async (transaction) => {
    const current = await transaction.client.findFirst({ where: { id: clientId, workspaceId: actor.workspaceId } });
    if (!current) throw new Error("Contacto no disponible en el workspace actual.");
    const responsibleId = await requireResponsible(transaction, actor, input.responsibleId);
    const names = firstAndLastName(input.name);
    const client = await transaction.client.update({ where: { id: clientId }, data: {
      name: input.name, ...names, company: compact(input.company), email: input.email, phone: input.phone, instagram: input.instagram,
      emailNormalized: normalizeEmail(input.email), phoneNormalized: normalizePhone(input.phone), instagramNormalized: normalizeInstagram(input.instagram),
      country: compact(input.country), address: compact(input.address), website: compact(input.website), notes: compact(input.notes), source: input.source ?? null,
      prospectStatus: input.prospectStatus ?? current.prospectStatus, responsibleId,
    } });
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId, action: "CONTACT_UPDATED", description: `Datos actualizados: ${client.name}` } });
    return client;
  });
}

export async function setCommercialClientFollowUp(database: PrismaClient, actor: WorkspaceActor, clientId: string, followUp: ClientCommercialInput["followUp"]) {
  return database.$transaction(async (transaction) => {
    const client = await transaction.client.findFirst({ where: { id: clientId, workspaceId: actor.workspaceId, archivedAt: null } });
    if (!client) throw new Error("Contacto no disponible en el workspace actual.");
    if (!followUp) {
      if (client.nextFollowUpEventId) await transaction.event.delete({ where: { id: client.nextFollowUpEventId } });
      await transaction.client.update({ where: { id: client.id }, data: { nextFollowUpEventId: null } });
      await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId, action: "FOLLOW_UP_CLEARED", description: "Seguimiento eliminado" } });
      return null;
    }
    return scheduleFollowUp(transaction, actor, client, followUp);
  });
}

export async function convertProspectToClient(database: PrismaClient, actor: WorkspaceActor, clientId: string) {
  return database.$transaction(async (transaction) => {
    const client = await transaction.client.findFirst({ where: { id: clientId, workspaceId: actor.workspaceId } });
    if (!client) throw new Error("Prospecto no disponible en el workspace actual.");
    if (client.stage === "CLIENT") return client;
    const converted = await transaction.client.update({ where: { id: client.id }, data: { stage: "CLIENT", prospectStatus: "WON", status: "ACTIVE", convertedAt: new Date() } });
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId, action: "PROSPECT_CONVERTED", description: `Prospecto convertido en cliente: ${client.name}` } });
    return converted;
  });
}
