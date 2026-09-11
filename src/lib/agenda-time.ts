export const AGENDA_TIME_ZONE = "Europe/Madrid";

export function isTime(value: string | null | undefined): value is string {
  return Boolean(value && /^([01]\d|2[0-3]):[0-5]\d$/.test(value));
}

/** Converts a Madrid wall-clock date/time to an instant without relying on Vercel's host timezone. */
export function madridDateTime(date: string, time = "00:00"): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hour, minute);
  const formatter = new Intl.DateTimeFormat("en-GB", { timeZone: AGENDA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  let instant = target;
  for (let attempt = 0; attempt < 3; attempt++) {
    const values = Object.fromEntries(formatter.formatToParts(new Date(instant)).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
    const rendered = Date.UTC(values.year!, values.month! - 1, values.day!, values.hour!, values.minute!);
    instant += target - rendered;
  }
  return new Date(instant);
}

export function madridDate(value: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AGENDA_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function madridTime(value: Date): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: AGENDA_TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(value);
}

export function allDayRange(date: string) {
  const startAt = madridDateTime(date);
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  const endAt = madridDateTime(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`);
  return { startAt, endAt };
}
