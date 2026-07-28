// Convierte un Quote de Prisma (con Decimal) a un objeto plano serializable en
// JSON, usado tanto para el render inicial en servidor como para los eventos
// `quote_updated` que viajan por el stream NDJSON del chat.

import type { QuoteStatus } from "@/generated/prisma/enums";

type Decimalish = { toString(): string } | number | string | null | undefined;

function toNumberOrNull(value: Decimalish): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export type QuoteSnapshotInput = {
  id: string;
  status: QuoteStatus;
  currency: string | null;
  taxRatePercent: Decimalish;
  subtotal: Decimalish;
  discountType: string | null;
  discountValue: Decimalish;
  discountReason: string | null;
  taxAmount: Decimalish;
  total: Decimalish;
  calculationExplanation: string | null;
  salesDescription: string | null;
  client: {
    id: string;
    name: string;
    company: string | null;
    email: string | null;
    phone: string | null;
    defaultCurrency: string | null;
  } | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: Decimalish;
    unitPrice: Decimalish;
    lineTotal: Decimalish;
    serviceId: string | null;
    sortOrder: number;
  }>;
};

export type QuoteSnapshot = ReturnType<typeof serializeQuote>;

export function serializeQuote(quote: QuoteSnapshotInput) {
  return {
    id: quote.id,
    status: quote.status,
    currency: quote.currency,
    taxRatePercent: toNumberOrNull(quote.taxRatePercent),
    subtotal: toNumberOrNull(quote.subtotal) ?? 0,
    discountType: quote.discountType,
    discountValue: toNumberOrNull(quote.discountValue),
    discountReason: quote.discountReason,
    taxAmount: toNumberOrNull(quote.taxAmount) ?? 0,
    total: toNumberOrNull(quote.total) ?? 0,
    calculationExplanation: quote.calculationExplanation,
    salesDescription: quote.salesDescription,
    client: quote.client,
    lineItems: quote.lineItems
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => ({
        id: item.id,
        description: item.description,
        quantity: toNumberOrNull(item.quantity) ?? 0,
        unitPrice: toNumberOrNull(item.unitPrice) ?? 0,
        lineTotal: toNumberOrNull(item.lineTotal) ?? 0,
        serviceId: item.serviceId,
      })),
  };
}
