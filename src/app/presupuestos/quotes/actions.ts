"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin, requireWorkspaceMembership } from "@/lib/workspace-access";
import { changeQuoteStatus, createQuoteFromDraft, quoteContactDuplicates, updateQuoteDraft, type QuoteDraftInput } from "@/lib/quote-workflow-service";
import type { QuoteStatus } from "@/generated/prisma/enums";

function payload(formData: FormData): QuoteDraftInput {
  const raw = formData.get("quote");
  if (typeof raw !== "string") throw new Error("Faltan los datos del presupuesto.");
  try {
    const data = JSON.parse(raw) as QuoteDraftInput & { validUntil?: string | null };
    return { ...data, validUntil: data.validUntil ? new Date(data.validUntil) : null };
  } catch {
    throw new Error("Los datos del presupuesto no son válidos.");
  }
}

/** Abre el asistente sin escribir un Quote ni mensajes de conversación. */
export async function createDraftQuote() { redirect("/presupuestos/nuevo"); }
export async function createDraftQuoteForClient(clientId: string) {
  const { workspace } = await requireWorkspaceMembership();
  const client = await prisma.client.findFirst({ where: { id: clientId, workspaceId: workspace.id, archivedAt: null }, select: { id: true } });
  if (!client) throw new Error("Cliente no disponible.");
  redirect(`/presupuestos/nuevo?clientId=${encodeURIComponent(client.id)}`);
}

/** Duplica únicamente un presupuesto existente y confirmado; nunca se usa al abrir el asistente. */
export async function duplicateQuote(quoteId: string) {
  const { user, workspace } = await requireWorkspaceMembership();
  const source = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id }, include: { lineItems: true } });
  if (!source) throw new Error("Presupuesto no disponible en el workspace actual.");
  const copy = await prisma.$transaction(async (tx) => {
    const quote = await tx.quote.create({ data: {
      workspaceId: workspace.id, userId: user.id, responsibleId: source.responsibleId ?? user.id, clientId: source.clientId, currency: source.currency,
      taxRatePercent: source.taxRatePercent, subtotal: source.subtotal, discountType: source.discountType, discountValue: source.discountValue, discountReason: source.discountReason,
      taxAmount: source.taxAmount, total: source.total, depositKind: source.depositKind, depositValue: source.depositValue, salesDescription: source.salesDescription,
      termsAndConditions: source.termsAndConditions, deliveryTimeline: source.deliveryTimeline, validUntil: source.validUntil,
      lineItems: { create: source.lineItems.map((line) => ({ serviceId: line.serviceId, description: line.description, quantity: line.quantity, unitPrice: line.unitPrice, lineTotal: line.lineTotal, discountPercent: line.discountPercent, sortOrder: line.sortOrder })) },
      statusHistory: { create: { status: "DRAFT", changedById: user.id, note: "Copia de presupuesto" } },
    } });
    await tx.activityRecord.create({ data: { workspaceId: workspace.id, actorId: user.id, clientId: source.clientId, action: "QUOTE_CREATED", description: `Presupuesto duplicado: ${quote.id.slice(0, 8)}` } });
    return quote;
  });
  revalidatePath("/", "layout");
  redirect(`/presupuestos/quotes/${copy.id}`);
}

export async function findQuoteContactDuplicates(contact: { email?: string | null; phone?: string | null; instagram?: string | null }) {
  const { workspace } = await requireWorkspaceMembership();
  return quoteContactDuplicates(prisma, workspace.id, contact);
}

export async function saveQuote(formData: FormData) {
  const { user, workspace, membership } = await requireWorkspaceMembership();
  const quote = await createQuoteFromDraft(prisma, { userId: user.id, workspaceId: workspace.id, role: membership.role }, payload(formData));
  revalidatePath("/", "layout");
  redirect(`/presupuestos/quotes/${quote.id}`);
}

export async function saveQuoteChanges(quoteId: string, formData: FormData) {
  const { user, workspace, membership } = await requireWorkspaceMembership();
  const quote = await updateQuoteDraft(prisma, { userId: user.id, workspaceId: workspace.id, role: membership.role }, quoteId, payload(formData));
  revalidatePath("/", "layout");
  return { id: quote.id };
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus, options?: { reason?: string; followUpAt?: string | null }) {
  const { user, workspace, membership } = await requireWorkspaceMembership();
  const followUpAt = options?.followUpAt ? new Date(options.followUpAt) : null;
  const result = await changeQuoteStatus(prisma, { userId: user.id, workspaceId: workspace.id, role: membership.role }, quoteId, status, { reason: options?.reason, followUpAt });
  revalidatePath("/", "layout");
  return result;
}

export async function deleteQuote(quoteId: string) {
  const { workspace } = await requireWorkspaceAdmin();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id }, select: { id: true } });
  if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");
  await prisma.quote.delete({ where: { id: quote.id } });
  revalidatePath("/", "layout");
}

export async function createQuoteNote(quoteId: string, content: string) {
  const { workspace } = await requireWorkspaceMembership();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id } });
  if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");
  const note = await prisma.quoteNote.create({ data: { quoteId, content: content.trim() } });
  revalidatePath("/", "layout");
  return { id: note.id, content: note.content, createdAt: note.createdAt.toISOString(), updatedAt: note.updatedAt.toISOString() };
}

export async function updateQuoteNote(noteId: string, content: string) {
  const { workspace } = await requireWorkspaceMembership();
  const note = await prisma.quoteNote.findFirst({ where: { id: noteId, quote: { workspaceId: workspace.id } } });
  if (!note) throw new Error("Nota no disponible en el workspace actual.");
  await prisma.quoteNote.update({ where: { id: noteId }, data: { content: content.trim() } });
  revalidatePath("/", "layout");
}

export async function deleteQuoteNote(noteId: string) {
  const { workspace } = await requireWorkspaceAdmin();
  const note = await prisma.quoteNote.findFirst({ where: { id: noteId, quote: { workspaceId: workspace.id } } });
  if (!note) throw new Error("Nota no disponible en el workspace actual.");
  await prisma.quoteNote.delete({ where: { id: noteId } });
  revalidatePath("/", "layout");
}
