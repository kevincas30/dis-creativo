// Catálogo oficial de redes sociales: códigos, recargos ("reglas generales")
// y wrapper tipado sobre el motor genérico de src/lib/catalog-pricing.ts.
// Gemini solo identifica servicio/cantidad/extras (ver process-budget-request.ts);
// toda la aritmética vive en el motor compartido, para garantizar que el
// presupuesto coincida céntimo a céntimo con el tarifario.

import { round2, type QuoteCurrency } from "@/lib/quote-pricing";
import { computeCatalogLine, type CatalogLineResult, type SurchargeLine } from "@/lib/catalog-pricing";

export { buildPricingBreakdownMarkdown, type SurchargeLine } from "@/lib/catalog-pricing";

export const SOCIAL_SERVICE_CODES = [
  "SOCIAL_POST",
  "SOCIAL_CAROUSEL",
  "SOCIAL_CAROUSEL_EXTRA_SLIDE",
  "SOCIAL_STORY",
  "SOCIAL_REEL_BASIC",
  "SOCIAL_EXTRA_REVIEW",
] as const;

export type SocialServiceCode = (typeof SOCIAL_SERVICE_CODES)[number];

export function isSocialServiceCode(value: string): value is SocialServiceCode {
  return (SOCIAL_SERVICE_CODES as readonly string[]).includes(value);
}

export type UrgencyLevel = "NONE" | "H48" | "H24";

// Recargos "regla general" — iguales en ES y MX, no dependen del catálogo en BD.
export const URGENCY_SURCHARGE_PERCENT: Record<UrgencyLevel, number> = {
  NONE: 0,
  H48: 25,
  H24: 40,
};
export const EDITABLE_FILES_SURCHARGE_PERCENT = 30;

export type SocialLineResult = CatalogLineResult;

/** Wrapper tipado de computeCatalogLine para códigos del catálogo de redes sociales. */
export async function computeSocialLine(
  code: SocialServiceCode,
  currency: QuoteCurrency,
  quantity: number,
  workspaceId: string,
): Promise<SocialLineResult | null> {
  return computeCatalogLine(code, currency, quantity, workspaceId);
}

export type SocialExtras = {
  urgency: UrgencyLevel;
  editableFiles: boolean;
};

/**
 * Recargos "regla general" sobre el proyecto: entrega urgente y archivos
 * editables, calculados sobre el subtotal de las líneas de servicio (antes
 * de aplicar los propios recargos).
 */
export function computeProjectSurcharges(baseSubtotal: number, extras: SocialExtras): SurchargeLine[] {
  const lines: SurchargeLine[] = [];

  const urgencyPercent = URGENCY_SURCHARGE_PERCENT[extras.urgency];
  if (urgencyPercent > 0) {
    lines.push({
      description: extras.urgency === "H24" ? "Entrega urgente 24 h" : "Entrega urgente 48 h",
      percent: urgencyPercent,
      lineTotal: round2(baseSubtotal * (urgencyPercent / 100)),
    });
  }

  if (extras.editableFiles) {
    lines.push({
      description: "Archivos editables",
      percent: EDITABLE_FILES_SURCHARGE_PERCENT,
      lineTotal: round2(baseSubtotal * (EDITABLE_FILES_SURCHARGE_PERCENT / 100)),
    });
  }

  return lines;
}
