"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import type { Prisma } from "@/generated/prisma/client";
import type { QuoteStatus } from "@/generated/prisma/enums";

export async function createDraftQuote() {
  const user = await getCurrentUser();
  const quote = await prisma.quote.create({ data: { userId: user.id } });
  revalidatePath("/", "layout");
  redirect(`/quotes/${quote.id}`);
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

  await prisma.quote.update({
    where: { id: quoteId },
    data: { status, statusHistory: { create: { status } } },
  });

  revalidatePath("/", "layout");
}
