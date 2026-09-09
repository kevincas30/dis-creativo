import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { Currency, DepositKind, QuoteStatus } from "@/generated/prisma/enums";
import type { WorkspaceActor } from "@/lib/workspace-access";
import { findClientDuplicates, normalizeEmail, normalizeInstagram, normalizePhone, validateClientCommercialInput } from "@/lib/client-commercial-service";

type Database = PrismaClient | Prisma.TransactionClient;
type Transaction = Prisma.TransactionClient;

export type QuoteLineInput = {
  id?: string;
  serviceId?: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discountPercent?: number | null;
};

export type ProposedContact = {
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  instagram?: string | null;
  country?: string | null;
  notes?: string | null;
};

export type QuoteDraftInput = {
  clientId?: string | null;
  newContact?: ProposedContact | null;
  useExistingClientId?: string | null;
  responsibleId?: string | null;
  currency: Currency;
  lines: QuoteLineInput[];
  discountType?: "PERCENTAGE" | "FIXED" | null;
  discountValue?: number | null;
  discountReason?: string | null;
  taxRatePercent?: number | null;
  deliveryTimeline?: string | null;
  salesDescription?: string | null;
  termsAndConditions?: string | null;
  notes?: string | null;
  depositKind?: DepositKind;
  depositValue?: number;
  validUntil?: Date | null;
};

const number = (value: number | null | undefined, fallback = 0) => Number.isFinite(value) ? Number(value) : fallback;
const round = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const trim = (value: string | null | undefined) => value?.trim() || null;

export function quoteTotals(input: Pick<QuoteDraftInput, "lines" | "discountType" | "discountValue" | "taxRatePercent">) {
  const subtotal = round(input.lines.reduce((total, line) => total + number(line.quantity, 0) * number(line.unitPrice, 0), 0));
  const rawDiscount = number(input.discountValue);
  const discount = input.discountType === "PERCENTAGE" ? round(subtotal * rawDiscount / 100) : input.discountType === "FIXED" ? Math.min(subtotal, rawDiscount) : 0;
  const taxable = Math.max(0, subtotal - discount);
  const taxRatePercent = input.taxRatePercent == null ? 0 : number(input.taxRatePercent);
  const taxAmount = round(taxable * taxRatePercent / 100);
  return { subtotal, discount, taxAmount, total: round(taxable + taxAmount), taxRatePercent };
}

export function depositAmount(total: number, kind: DepositKind, value: number) {
  if (kind === "NONE") return 0;
  if (kind === "FULL") return round(total);
  if (kind === "FIXED") return round(Math.max(0, Math.min(total, value)));
  return round(Math.max(0, Math.min(total, total * value / 100)));
}

export function validateQuoteDraft(raw: QuoteDraftInput) {
  const lines = raw.lines.map((line, index) => ({
    ...line,
    description: line.description.trim(),
    quantity: number(line.quantity),
    unitPrice: number(line.unitPrice),
    discountPercent: line.discountPercent == null ? null : number(line.discountPercent),
    sortOrder: index,
  })).filter((line) => line.description || line.serviceId);
  if (!raw.clientId && !raw.useExistingClientId && !raw.newContact) throw new Error("Selecciona un contacto o revisa la propuesta de cliente.");
  if (raw.newContact) validateClientCommercialInput({ stage: "PROSPECT", ...raw.newContact });
  if (lines.length === 0) throw new Error("Añade al menos un servicio o concepto antes de guardar.");
  for (const line of lines) {
    if (!line.description) throw new Error("Cada línea necesita una descripción.");
    if (line.quantity <= 0 || line.unitPrice < 0) throw new Error("Las cantidades y precios deben ser válidos.");
  }
  const depositKind = raw.depositKind ?? "PERCENTAGE";
  const depositValue = number(raw.depositValue, depositKind === "PERCENTAGE" ? 50 : 0);
  if (depositValue < 0) throw new Error("El anticipo no puede ser negativo.");
  const totals = quoteTotals({ ...raw, lines });
  return { ...raw, lines, depositKind, depositValue, ...totals };
}

async function scopedClient(transaction: Transaction, workspaceId: string, clientId: string) {
  const client = await transaction.client.findFirst({ where: { id: clientId, workspaceId, archivedAt: null } });
  if (!client) throw new Error("Cliente no disponible en el workspace actual.");
  return client;
}

async function scopedResponsible(transaction: Transaction, actor: WorkspaceActor, value?: string | null) {
  const userId = value ?? actor.userId;
  const membership = await transaction.workspaceMember.findFirst({ where: { workspaceId: actor.workspaceId, userId }, select: { userId: true } });
  if (!membership) throw new Error("La persona responsable no pertenece al workspace actual.");
  return membership.userId;
}

async function resolveClient(transaction: Transaction, actor: WorkspaceActor, input: ReturnType<typeof validateQuoteDraft>) {
  if (input.clientId) return scopedClient(transaction, actor.workspaceId, input.clientId);
  if (input.useExistingClientId) return scopedClient(transaction, actor.workspaceId, input.useExistingClientId);
  const contact = input.newContact!;
  const duplicates = await findClientDuplicates(transaction, actor.workspaceId, contact);
  if (duplicates.length > 0) throw new Error("Hay un contacto coincidente. Vincúlalo antes de crear uno nuevo.");
  const validated = validateClientCommercialInput({ stage: "PROSPECT", ...contact });
  const responsibleId = await scopedResponsible(transaction, actor, input.responsibleId);
  const parts = validated.name.trim().split(/\s+/);
  const client = await transaction.client.create({ data: {
    workspaceId: actor.workspaceId, name: validated.name, firstName: parts[0] ?? null, lastName: parts.slice(1).join(" ") || null,
    company: trim(validated.company), email: validated.email, phone: validated.phone, instagram: validated.instagram, country: trim(validated.country), notes: trim(validated.notes),
    emailNormalized: normalizeEmail(validated.email), phoneNormalized: normalizePhone(validated.phone), instagramNormalized: normalizeInstagram(validated.instagram),
    stage: "PROSPECT", prospectStatus: "QUOTE", responsibleId,
  } });
  await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: client.id, action: "PROSPECT_CREATED_FROM_QUOTE", description: `Prospecto creado al confirmar presupuesto: ${client.name}` } });
  return client;
}

export async function createQuoteFromDraft(database: PrismaClient, actor: WorkspaceActor, raw: QuoteDraftInput) {
  const input = validateQuoteDraft(raw);
  return database.$transaction(async (transaction) => {
    const client = await resolveClient(transaction, actor, input);
    const responsibleId = await scopedResponsible(transaction, actor, input.responsibleId ?? client.responsibleId);
    const quote = await transaction.quote.create({ data: {
      workspaceId: actor.workspaceId, userId: actor.userId, responsibleId, clientId: client.id, currency: input.currency,
      taxRatePercent: input.taxRatePercent, subtotal: input.subtotal, discountType: input.discountType ?? null, discountValue: input.discountValue ?? null,
      discountReason: trim(input.discountReason), taxAmount: input.taxAmount, total: input.total, deliveryTimeline: trim(input.deliveryTimeline),
      salesDescription: trim(input.salesDescription), termsAndConditions: trim(input.termsAndConditions), depositKind: input.depositKind, depositValue: input.depositValue,
      validUntil: input.validUntil ?? null, status: "DRAFT",
      lineItems: { create: input.lines.map((line) => ({ serviceId: line.serviceId ?? null, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: round(line.quantity * line.unitPrice), discountPercent: line.discountPercent, sortOrder: line.sortOrder })) },
      notes: trim(input.notes) ? { create: { content: trim(input.notes)! } } : undefined,
      statusHistory: { create: { status: "DRAFT", changedById: actor.userId, note: "Presupuesto confirmado" } },
    }, include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } } } });
    if (client.stage === "PROSPECT" && client.prospectStatus !== "QUOTE") await transaction.client.update({ where: { id: client.id }, data: { prospectStatus: "QUOTE" } });
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: client.id, action: "QUOTE_CREATED", description: `Presupuesto creado: ${quote.id.slice(0, 8)}` } });
    return quote;
  });
}

export async function updateQuoteDraft(database: PrismaClient, actor: WorkspaceActor, quoteId: string, raw: QuoteDraftInput) {
  const input = validateQuoteDraft(raw);
  return database.$transaction(async (transaction) => {
    const current = await transaction.quote.findFirst({ where: { id: quoteId, workspaceId: actor.workspaceId }, include: { client: true } });
    if (!current) throw new Error("Presupuesto no disponible en el workspace actual.");
    const client = input.clientId || input.useExistingClientId || input.newContact ? await resolveClient(transaction, actor, input) : current.client;
    const responsibleId = await scopedResponsible(transaction, actor, input.responsibleId ?? current.responsibleId ?? client?.responsibleId);
    await transaction.quoteLineItem.deleteMany({ where: { quoteId } });
    const quote = await transaction.quote.update({ where: { id: quoteId }, data: {
      clientId: client?.id ?? null, responsibleId, currency: input.currency, taxRatePercent: input.taxRatePercent, subtotal: input.subtotal,
      discountType: input.discountType ?? null, discountValue: input.discountValue ?? null, discountReason: trim(input.discountReason), taxAmount: input.taxAmount, total: input.total,
      deliveryTimeline: trim(input.deliveryTimeline), salesDescription: trim(input.salesDescription), termsAndConditions: trim(input.termsAndConditions), depositKind: input.depositKind, depositValue: input.depositValue,
      validUntil: input.validUntil ?? null, lineItems: { create: input.lines.map((line) => ({ serviceId: line.serviceId ?? null, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: round(line.quantity * line.unitPrice), discountPercent: line.discountPercent, sortOrder: line.sortOrder })) },
    }, include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } } } });
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: quote.clientId, action: "QUOTE_UPDATED", description: `Presupuesto actualizado: ${quote.id.slice(0, 8)}` } });
    return quote;
  });
}

export async function changeQuoteStatus(database: PrismaClient, actor: WorkspaceActor, quoteId: string, status: QuoteStatus, options?: { reason?: string | null; followUpAt?: Date | null }) {
  if (status === "ARCHIVED" && actor.role !== "ADMIN") throw new Error("Solo un administrador puede archivar presupuestos.");
  return database.$transaction(async (transaction) => {
    const quote = await transaction.quote.findFirst({ where: { id: quoteId, workspaceId: actor.workspaceId }, include: { client: true, projects: { select: { id: true } } } });
    if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");
    if (status === "PAID") throw new Error("Los pagos se registran en el proyecto, no como estado del presupuesto.");
    const allowed: QuoteStatus[] = ["DRAFT", "READY_TO_SEND", "SENT", "ACCEPTED", "REJECTED", "EXPIRED", "ARCHIVED"];
    if (!allowed.includes(status)) throw new Error("Estado no válido.");
    if (status === quote.status) return { hasProject: quote.projects.length > 0, followUpDate: quote.followUpDate };
    const now = new Date();
    const update: Prisma.QuoteUpdateInput = { status, ...(status === "SENT" && !quote.sentAt ? { sentAt: now } : {}), ...(status === "ACCEPTED" && !quote.approvedAt ? { approvedAt: now } : {}) };
    if (status === "SENT") {
      const followUpAt = options?.followUpAt ?? new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(followUpAt.getTime())) throw new Error("La fecha de seguimiento no es válida.");
      const startAt = followUpAt;
      const endAt = new Date(startAt.getTime() + 30 * 60 * 1000);
      const existingFollowUp = await transaction.event.findFirst({ where: { workspaceId: actor.workspaceId, quoteId, type: "FOLLOW_UP" }, orderBy: { createdAt: "desc" } });
      const followUpData = { clientId: quote.clientId, title: `Seguimiento: ${quote.client?.name ?? "presupuesto"}`, type: "FOLLOW_UP" as const, startAt, endAt, notes: "Seguimiento de presupuesto enviado" };
      if (existingFollowUp) await transaction.event.update({ where: { id: existingFollowUp.id }, data: followUpData });
      else await transaction.event.create({ data: { workspaceId: actor.workspaceId, userId: actor.userId, quoteId, ...followUpData } });
      update.followUpDate = startAt;
    }
    await transaction.quote.update({ where: { id: quoteId }, data: { ...update, statusHistory: { create: { status, note: trim(options?.reason), changedById: actor.userId } } } });
    if (status === "ACCEPTED" && quote.client?.stage === "PROSPECT") {
      await transaction.client.update({ where: { id: quote.client.id }, data: { stage: "CLIENT", prospectStatus: "WON", status: "ACTIVE", convertedAt: quote.client.convertedAt ?? now } });
      await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: quote.client.id, action: "PROSPECT_CONVERTED", description: `Prospecto convertido al aprobar presupuesto: ${quote.client.name}` } });
    }
    await transaction.activityRecord.create({ data: { workspaceId: actor.workspaceId, actorId: actor.userId, clientId: quote.clientId, action: "QUOTE_STATUS_CHANGED", description: `Estado del presupuesto ${quote.id.slice(0, 8)}: ${status}` } });
    return { hasProject: quote.projects.length > 0, followUpDate: status === "SENT" ? update.followUpDate as Date : quote.followUpDate };
  });
}

export async function quoteContactDuplicates(database: Database, workspaceId: string, contact: Pick<ProposedContact, "email" | "phone" | "instagram">) {
  return findClientDuplicates(database, workspaceId, contact);
}
