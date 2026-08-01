const COUNTRY_BY_CURRENCY: Record<string, string> = {
  EUR: "España",
  MXN: "México",
};

const DIACRITICS_REGEX = new RegExp("[̀-ͯ]", "g");

export function countryLabel(currency: string | null) {
  if (!currency) return "—";
  return COUNTRY_BY_CURRENCY[currency] ?? "—";
}

const LOCALE_BY_CURRENCY: Record<string, string> = {
  EUR: "es-ES",
  MXN: "es-MX",
};

export function formatMoney(value: number, currency: string | null) {
  return new Intl.NumberFormat(LOCALE_BY_CURRENCY[currency ?? "EUR"] ?? "es-ES", {
    style: "currency",
    currency: currency ?? "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

export function quoteNumber(id: string) {
  return `COT-${id.slice(0, 8).toUpperCase()}`;
}

export function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
