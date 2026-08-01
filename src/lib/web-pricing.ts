// Catálogo oficial de servicios web (paquetes, hosting/dominio, mantenimiento,
// cambios posteriores): códigos, recargos ("reglas generales") y wrapper
// tipado sobre el motor genérico de src/lib/catalog-pricing.ts. A diferencia
// del catálogo de redes sociales, no tiene tramos de descuento por volumen.

import { round2, type QuoteCurrency } from "@/lib/quote-pricing";
import { computeCatalogLine, type CatalogLineResult, type SurchargeLine } from "@/lib/catalog-pricing";

export const WEB_SERVICE_CODES = [
  // Servicios web
  "WEB_LANDING",
  "WEB_BASIC",
  "WEB_BUSINESS",
  "WEB_CORPORATE",
  "WEB_PRO",
  "WEB_PORTFOLIO",
  "WEB_RESTAURANT",
  "WEB_QR_MENU",
  "WEB_BOOKING",
  "WEB_BLOG",
  "WEB_ECOMMERCE_BASIC",
  "WEB_ECOMMERCE_PRO",
  "WEB_EXTRA_PAGE",
  "WEB_ADVANCED_FORM",
  "WEB_DATABASE_BASIC",
  "WEB_DATABASE_PRO",
  "WEB_ADMIN_PANEL",
  "WEB_WHATSAPP",
  "WEB_SOCIAL_FEED",
  "WEB_SEO_BASIC",
  "WEB_SEO_ADVANCED",
  // Hosting y dominio
  "HOSTING_BASIC",
  "HOSTING_PRO",
  "DOMAIN_ANNUAL",
  "EMAIL_PRO",
  // Mantenimiento web
  "MAINTENANCE_BASIC",
  "MAINTENANCE_PRO",
  // Cambios posteriores web
  "WEB_CHANGE_TEXT",
  "WEB_CHANGE_SECTION",
  "WEB_CHANGE_PAGE",
  "WEB_CHANGE_STRUCTURAL",
] as const;

export type WebServiceCode = (typeof WEB_SERVICE_CODES)[number];

export function isWebServiceCode(value: string): value is WebServiceCode {
  return (WEB_SERVICE_CODES as readonly string[]).includes(value);
}

export type WebUrgencyLevel = "NONE" | "D7" | "D3";

// Recargos "regla general" — iguales en ES y MX, no dependen del catálogo en BD.
export const URGENCY_SURCHARGE_PERCENT_WEB: Record<WebUrgencyLevel, number> = {
  NONE: 0,
  D7: 20,
  D3: 40,
};
export const MULTILANGUAGE_SURCHARGE_PERCENT = 25;

export type WebLineResult = CatalogLineResult;

/** Wrapper tipado de computeCatalogLine para códigos del catálogo web. */
export async function computeWebLine(
  code: WebServiceCode,
  currency: QuoteCurrency,
  quantity: number,
): Promise<WebLineResult | null> {
  return computeCatalogLine(code, currency, quantity);
}

export type WebExtras = {
  urgency: WebUrgencyLevel;
  multilanguage: boolean;
};

/**
 * Recargos "regla general" sobre el proyecto web: entrega urgente (<7 días,
 * <3 días) y multiidioma, calculados sobre el subtotal de las líneas del
 * catálogo web pedidas en ese turno (antes de aplicar los propios recargos).
 */
export function computeWebSurcharges(baseSubtotal: number, extras: WebExtras): SurchargeLine[] {
  const lines: SurchargeLine[] = [];

  const urgencyPercent = URGENCY_SURCHARGE_PERCENT_WEB[extras.urgency];
  if (urgencyPercent > 0) {
    lines.push({
      description: extras.urgency === "D3" ? "Entrega urgente (< 3 días)" : "Entrega urgente (< 7 días)",
      percent: urgencyPercent,
      lineTotal: round2(baseSubtotal * (urgencyPercent / 100)),
    });
  }

  if (extras.multilanguage) {
    lines.push({
      description: "Multiidioma",
      percent: MULTILANGUAGE_SURCHARGE_PERCENT,
      lineTotal: round2(baseSubtotal * (MULTILANGUAGE_SURCHARGE_PERCENT / 100)),
    });
  }

  return lines;
}
