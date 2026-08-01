import type { WebQuoteDetails } from "@/lib/web-quote";

export type QuotePdfData = {
  id: string;
  issuedAt: Date;
  validUntil: Date | null;
  currency: string | null;
  taxRatePercent: number | null;
  subtotal: number;
  discountType: string | null;
  discountValue: number | null;
  taxAmount: number;
  total: number;
  salesDescription: string | null;
  deliveryTimeline: string | null;
  client: {
    name: string;
    company: string | null;
  } | null;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    discountPercent: number | null;
    serviceName: string | null;
    serviceDescription: string | null;
  }>;
  webDetails: WebQuoteDetails | null;
};
