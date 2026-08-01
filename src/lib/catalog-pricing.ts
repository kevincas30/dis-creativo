// Núcleo determinista compartido por todos los catálogos oficiales de precios
// (redes sociales, servicios web, ...). Cada dominio (src/lib/social-pricing.ts,
// src/lib/web-pricing.ts) define sus propios códigos y "reglas generales"
// (recargos), pero la búsqueda de precio/tramo de descuento y el desglose
// Markdown son idénticos, así que viven aquí una sola vez.

import { prisma } from "@/lib/prisma";
import { round2, type QuoteCurrency } from "@/lib/quote-pricing";

export type CatalogLineResult = {
  code: string;
  description: string;
  quantity: number;
  unitPrice: number;
  quantitySubtotal: number;
  discountPercent: number;
  discountAmount: number;
  lineTotal: number;
};

export type SurchargeLine = {
  description: string;
  percent: number;
  lineTotal: number;
};

function resolveDiscountPercent(
  rules: Array<{ minQty: number; maxQty: number | null; percent: number }>,
  quantity: number,
) {
  const match = rules.find((rule) => quantity >= rule.minQty && (rule.maxQty === null || quantity <= rule.maxQty));
  return match ? match.percent : 0;
}

/**
 * Calcula una línea del catálogo oficial (subtotal línea → descuento línea →
 * total línea). Devuelve null si el código no existe en el catálogo o no
 * tiene precio para esa moneda. Sin tramos de `DiscountRule`, el descuento
 * siempre es 0% (caso del catálogo web).
 */
export async function computeCatalogLine(
  code: string,
  currency: QuoteCurrency,
  quantity: number,
): Promise<CatalogLineResult | null> {
  if (!(quantity > 0)) return null;

  const service = await prisma.service.findUnique({
    where: { code },
    include: { pricingRules: true, discountRules: true },
  });
  if (!service) return null;

  const pricingRule = service.pricingRules.find((rule) => rule.currency === currency);
  if (!pricingRule) return null;

  const unitPrice = Number(pricingRule.basePrice);
  const quantitySubtotal = round2(unitPrice * quantity);
  const discountPercent = resolveDiscountPercent(
    service.discountRules.map((rule) => ({
      minQty: rule.minQty,
      maxQty: rule.maxQty,
      percent: Number(rule.percent),
    })),
    quantity,
  );
  const discountAmount = round2(quantitySubtotal * (discountPercent / 100));
  const lineTotal = round2(quantitySubtotal - discountAmount);

  return {
    code,
    description: service.name,
    quantity,
    unitPrice,
    quantitySubtotal,
    discountPercent,
    discountAmount,
    lineTotal,
  };
}

function formatMoney(value: number, currency: QuoteCurrency) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency }).format(value);
}

/**
 * Bloque Markdown determinista con el desglose completo (cálculo original,
 * % aplicado, ahorro, subtotal, IVA, total). Se ancla siempre al resultado
 * ya guardado en BD, nunca a lo que Gemini haya escrito, para garantizar
 * que los números que ve el cliente sean exactos. Puede mezclar líneas de
 * distintos catálogos (p. ej. redes sociales + web) en un mismo turno.
 */
export function buildPricingBreakdownMarkdown(params: {
  currency: QuoteCurrency;
  taxRatePercent: number;
  lines: CatalogLineResult[];
  surcharges: SurchargeLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
}): string {
  const { currency, taxRatePercent, lines, surcharges, subtotal, taxAmount, total } = params;
  if (lines.length === 0 && surcharges.length === 0) return "";

  const rows: string[] = ["", "### 💶 Desglose del cálculo"];

  for (const line of lines) {
    rows.push(
      `- **${line.description}** — ${line.quantity} × ${formatMoney(line.unitPrice, currency)} = ${formatMoney(
        line.quantitySubtotal,
        currency,
      )}${
        line.discountPercent > 0
          ? ` · descuento ${line.discountPercent}% (-${formatMoney(line.discountAmount, currency)}) → **${formatMoney(
              line.lineTotal,
              currency,
            )}**`
          : ""
      }`,
    );
  }

  for (const surcharge of surcharges) {
    rows.push(`- **${surcharge.description}** (+${surcharge.percent}%) = ${formatMoney(surcharge.lineTotal, currency)}`);
  }

  rows.push("");
  rows.push(`Subtotal: ${formatMoney(subtotal, currency)}`);
  rows.push(`IVA (${taxRatePercent}%): ${formatMoney(taxAmount, currency)}`);
  rows.push(`**Total final: ${formatMoney(total, currency)}**`);

  return rows.join("\n");
}
