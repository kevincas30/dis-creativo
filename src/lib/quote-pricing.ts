// Reglas de mercado compartidas: país -> moneda/IVA. Únicos dos mercados que
// el estudio soporta hoy (PRD sección 5).

export type QuoteCurrency = "MXN" | "EUR";

export const COUNTRY_CONFIG: Record<string, { currency: QuoteCurrency; taxRatePercent: number }> = {
  espana: { currency: "EUR", taxRatePercent: 21 },
  mexico: { currency: "MXN", taxRatePercent: 16 },
};

function normalizeCountry(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

export function resolveCountry(value: string | null | undefined) {
  if (!value || !value.trim()) return undefined;
  return COUNTRY_CONFIG[normalizeCountry(value)];
}

export function round2(value: number) {
  // Corrige el error de coma flotante de Math.round(value * 100) / 100
  // (p. ej. 67.5 * 0.21 = 14.174999999999999 en JS, que redondearía a 14.17
  // en vez de los 14.18 esperados con redondeo "half up").
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
