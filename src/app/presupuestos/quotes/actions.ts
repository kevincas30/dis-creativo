"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceAdmin, requireWorkspaceMembership } from "@/lib/workspace-access";
import { firstNameOf } from "@/lib/names";
import type { Prisma } from "@/generated/prisma/client";
import type { QuoteStatus } from "@/generated/prisma/enums";

// Saludo y mensaje de intake fijos — se siembran directo en la base de datos
// (sin llamar a Gemini) para no gastar cuota solo en arrancar la conversación.
const GREETING_MESSAGE = "Hola, quiero hacer un presupuesto";

function buildIntakeMessage(name: string) {
  return `# Vamos a crear tu presupuesto

Muy bien ${name}, envíame la siguiente información para preparar la propuesta más rápido:

- 👤 Cliente
- 🌍 País
- 🏢 Empresa (opcional)
- 💼 Servicio o proyecto
- 📦 Cantidad o alcance
- 💶 Moneda (EUR o MXN)
- 📅 Fecha límite (opcional)
- 📝 Notas adicionales (opcional)

---

Con esa información podré preparar el presupuesto rápidamente. 🚀`;
}

export async function createDraftQuote() { return makeDraftQuote(); }

export async function createDraftQuoteForClient(clientId: string) { return makeDraftQuote(clientId); }

async function makeDraftQuote(clientId?: string) {
  const { user, workspace } = await requireWorkspaceMembership();
  if (clientId && !await prisma.client.findFirst({ where: { id: clientId, workspaceId: workspace.id, archivedAt: null } })) throw new Error("Cliente no disponible.");
  const greetingAt = new Date();
  const intakeAt = new Date(greetingAt.getTime() + 1);

  const quote = await prisma.$transaction(async (tx) => {
  const created = await tx.quote.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      clientId,
      messages: {
        create: [
          { role: "user", content: GREETING_MESSAGE, createdAt: greetingAt },
          { role: "assistant", content: buildIntakeMessage(firstNameOf(user.displayName)), createdAt: intakeAt },
        ],
      },
    },
  });
  await tx.activityRecord.create({ data: { workspaceId: workspace.id, actorId: user.id, clientId, action: "QUOTE_CREATED", description: `Presupuesto creado: ${created.id.slice(0, 8)}` } });
  return created;
  });
  revalidatePath("/", "layout");
  redirect(`/presupuestos/quotes/${quote.id}?new=1`);
}

export async function duplicateQuote(quoteId: string) {
  const { user, workspace } = await requireWorkspaceMembership();
  const source = await prisma.quote.findFirst({
    where: { id: quoteId, workspaceId: workspace.id },
    include: { lineItems: true, client: true },
  });

  if (!source) throw new Error("Presupuesto no disponible en el workspace actual.");

  const introMessage = source.client
    ? `Este presupuesto es una copia de "${source.client.name}". Puedes seguir ajustándolo desde aquí — dime qué quieres cambiar.`
    : "Esta es una copia de un presupuesto sin datos todavía. Vamos a crear el presupuesto — ¿cuál es el nombre del cliente?";

  const duplicate = await prisma.quote.create({
    data: {
      userId: user.id,
      workspaceId: workspace.id,
      clientId: source.clientId,
      currency: source.currency,
      taxRatePercent: source.taxRatePercent,
      subtotal: source.subtotal,
      discountType: source.discountType,
      discountValue: source.discountValue,
      discountReason: source.discountReason,
      taxAmount: source.taxAmount,
      total: source.total,
      calculationExplanation: source.calculationExplanation,
      salesDescription: source.salesDescription,
      termsAndConditions: source.termsAndConditions,
      deliveryTimeline: source.deliveryTimeline,
      questionnaireAnswers: (source.questionnaireAnswers ?? undefined) as Prisma.InputJsonValue | undefined,
      lineItems: {
        create: source.lineItems.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.lineTotal,
          serviceId: item.serviceId,
          sortOrder: item.sortOrder,
        })),
      },
      statusHistory: { create: { status: "DRAFT" } },
      messages: { create: { role: "assistant", content: introMessage } },
    },
  });

  revalidatePath("/", "layout");
  redirect(`/presupuestos/quotes/${duplicate.id}`);
}

export async function deleteQuote(quoteId: string) {
  const { workspace } = await requireWorkspaceAdmin();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id } });
  if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");

  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath("/", "layout");
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const { user, workspace } = await requireWorkspaceMembership();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id } });
  if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");

  // Sella la fecha de seguimiento la primera vez que se alcanza ese estado
  // (nunca se sobrescribe en cambios posteriores). Alimenta la tarjeta
  // "Seguimiento" del panel derecho sin importar desde qué UI se cambió el estado.
  const timestamps = {
    ...(status === "SENT" && !quote.sentAt ? { sentAt: new Date() } : {}),
    ...(status === "ACCEPTED" && !quote.approvedAt ? { approvedAt: new Date() } : {}),
    ...(status === "PAID" && !quote.paidAt ? { paidAt: new Date() } : {}),
  };

  if (status === quote.status) return;
  const labels: Record<QuoteStatus, string> = { DRAFT: "Borrador", SENT: "Enviado", ACCEPTED: "Aprobado", REJECTED: "Rechazado", ARCHIVED: "Archivado", PAID: "Marcado pagado en presupuesto (sin registrar cobro)" };
  if (!Object.hasOwn(labels, status)) throw new Error("Estado no válido.");
  await prisma.$transaction(async (tx) => {
    await tx.quote.update({ where: { id: quoteId }, data: { status, ...timestamps, statusHistory: { create: { status } } } });
    await tx.activityRecord.create({ data: { workspaceId: workspace.id, actorId: user.id, clientId: quote.clientId, action: "QUOTE_STATUS_CHANGED", description: `Presupuesto ${quoteId.slice(0, 8)}: ${labels[status]}` } });
  });

  revalidatePath("/", "layout");
}

export async function createQuoteNote(quoteId: string, content: string) {
  const { workspace } = await requireWorkspaceMembership();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id } });
  if (!quote) throw new Error("Presupuesto no disponible en el workspace actual.");

  const note = await prisma.quoteNote.create({ data: { quoteId, content } });
  revalidatePath("/", "layout");

  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

export async function updateQuoteNote(noteId: string, content: string) {
  const { workspace } = await requireWorkspaceMembership();
  const note = await prisma.quoteNote.findFirst({ where: { id: noteId, quote: { workspaceId: workspace.id } } });
  if (!note) throw new Error("Nota no disponible en el workspace actual.");

  await prisma.quoteNote.update({ where: { id: noteId }, data: { content } });
  revalidatePath("/", "layout");
}

export async function deleteQuoteNote(noteId: string) {
  const { workspace } = await requireWorkspaceAdmin();
  const note = await prisma.quoteNote.findFirst({ where: { id: noteId, quote: { workspaceId: workspace.id } } });
  if (!note) throw new Error("Nota no disponible en el workspace actual.");

  await prisma.quoteNote.delete({ where: { id: noteId } });
  revalidatePath("/", "layout");
}
