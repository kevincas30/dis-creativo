"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
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

export async function createDraftQuote() {
  const user = await getCurrentUser();
  const greetingAt = new Date();
  const intakeAt = new Date(greetingAt.getTime() + 1);

  const quote = await prisma.quote.create({
    data: {
      userId: user.id,
      messages: {
        create: [
          { role: "user", content: GREETING_MESSAGE, createdAt: greetingAt },
          { role: "assistant", content: buildIntakeMessage(firstNameOf(user.displayName)), createdAt: intakeAt },
        ],
      },
    },
  });
  revalidatePath("/", "layout");
  redirect(`/quotes/${quote.id}?new=1`);
}

export async function duplicateQuote(quoteId: string) {
  const user = await getCurrentUser();
  const source = await prisma.quote.findUniqueOrThrow({
    where: { id: quoteId },
    include: { lineItems: true, client: true },
  });

  if (source.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  const introMessage = source.client
    ? `Este presupuesto es una copia de "${source.client.name}". Puedes seguir ajustándolo desde aquí — dime qué quieres cambiar.`
    : "Esta es una copia de un presupuesto sin datos todavía. Vamos a crear el presupuesto — ¿cuál es el nombre del cliente?";

  const duplicate = await prisma.quote.create({
    data: {
      userId: user.id,
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
  redirect(`/quotes/${duplicate.id}`);
}

export async function deleteQuote(quoteId: string) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

  if (quote.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  await prisma.quote.delete({ where: { id: quoteId } });
  revalidatePath("/", "layout");
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

  if (quote.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  // Sella la fecha de seguimiento la primera vez que se alcanza ese estado
  // (nunca se sobrescribe en cambios posteriores). Alimenta la tarjeta
  // "Seguimiento" del panel derecho sin importar desde qué UI se cambió el estado.
  const timestamps = {
    ...(status === "SENT" && !quote.sentAt ? { sentAt: new Date() } : {}),
    ...(status === "ACCEPTED" && !quote.approvedAt ? { approvedAt: new Date() } : {}),
    ...(status === "PAID" && !quote.paidAt ? { paidAt: new Date() } : {}),
  };

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status, ...timestamps, statusHistory: { create: { status } } },
  });

  revalidatePath("/", "layout");
}

export async function createQuoteNote(quoteId: string, content: string) {
  const user = await getCurrentUser();
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

  if (quote.userId !== user.id) {
    throw new Error("No autorizado.");
  }

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
  const user = await getCurrentUser();
  const note = await prisma.quoteNote.findUniqueOrThrow({ where: { id: noteId }, include: { quote: true } });

  if (note.quote.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  await prisma.quoteNote.update({ where: { id: noteId }, data: { content } });
  revalidatePath("/", "layout");
}

export async function deleteQuoteNote(noteId: string) {
  const user = await getCurrentUser();
  const note = await prisma.quoteNote.findUniqueOrThrow({ where: { id: noteId }, include: { quote: true } });

  if (note.quote.userId !== user.id) {
    throw new Error("No autorizado.");
  }

  await prisma.quoteNote.delete({ where: { id: noteId } });
  revalidatePath("/", "layout");
}
