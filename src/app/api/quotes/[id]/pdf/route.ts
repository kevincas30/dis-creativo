import { createElement, type ReactElement } from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import QuotePdfDocument from "@/lib/pdf/QuotePdfDocument";
import WebQuoteDocument from "@/lib/pdf/WebQuoteDocument";
import { getLogoBuffers } from "@/lib/pdf/logo";
import { formatDate, slugify } from "@/lib/pdf/format";
import { parseWebQuoteDetails } from "@/lib/web-quote";

export async function GET(_request: Request, ctx: RouteContext<"/api/quotes/[id]/pdf">) {
  const { id } = await ctx.params;
  let workspaceId: string;
  try {
    workspaceId = (await requireWorkspaceMembership()).workspace.id;
  } catch {
    return new Response("No autorizado.", { status: 403 });
  }

  const quote = await prisma.quote.findFirst({
    where: { id, workspaceId },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" }, include: { service: true } },
    },
  });

  if (!quote) {
    return new Response("No autorizado.", { status: 403 });
  }

  const logos = await getLogoBuffers();
  const webDetails = parseWebQuoteDetails(quote.questionnaireAnswers);

  const quoteData = {
    id: quote.id,
    issuedAt: quote.issuedAt,
    validUntil: quote.validUntil,
    currency: quote.currency,
    taxRatePercent: quote.taxRatePercent ? Number(quote.taxRatePercent) : null,
    subtotal: Number(quote.subtotal),
    discountType: quote.discountType,
    discountValue: quote.discountValue ? Number(quote.discountValue) : null,
    taxAmount: Number(quote.taxAmount),
    total: Number(quote.total),
    depositKind: quote.depositKind,
    depositValue: Number(quote.depositValue),
    salesDescription: quote.salesDescription,
    deliveryTimeline: quote.deliveryTimeline,
    client: quote.client ? { name: quote.client.name, company: quote.client.company } : null,
    lineItems: quote.lineItems.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      lineTotal: Number(item.lineTotal),
      discountPercent: item.discountPercent ? Number(item.discountPercent) : null,
      serviceName: item.service?.name ?? null,
      serviceDescription: item.service?.description ?? null,
    })),
    webDetails,
  };

  // Los presupuestos de sitios web usan un formato de PDF extendido (secciones
  // de alcance, arquitectura de información, mantenimiento, hitos de pago);
  // el resto de servicios sigue con el formato de 3 páginas de siempre.
  const buffer = await renderToBuffer(
    (webDetails
      ? createElement(WebQuoteDocument, { quote: quoteData, logoSquare: logos.square })
      : createElement(QuotePdfDocument, { quote: quoteData, logos })) as ReactElement<DocumentProps>,
  );

  const clientSlug = slugify(quote.client?.name ?? "presupuesto");
  const dateSlug = formatDate(quote.issuedAt).replace(/\s+/g, "-");
  const filename = `presupuesto-${clientSlug}-${dateSlug}.pdf`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
