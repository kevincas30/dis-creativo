// Utilidades de fecha para la Agenda — cálculo de grillas de mes/semana con
// Date nativo, sin librerías (el resto de la app tampoco usa ninguna).
// Semana empieza en lunes (convención española/mexicana).

export function parseMonthParam(month: string | undefined): Date {
  if (month) {
    const match = /^(\d{4})-(\d{2})$/.exec(month);
    if (match) {
      const year = Number(match[1]);
      const monthIndex = Number(match[2]) - 1;
      if (monthIndex >= 0 && monthIndex <= 11) return new Date(year, monthIndex, 1);
    }
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export function toMonthParam(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Clave estable para agrupar quotes por día en un Map (independiente de zona horaria dentro del proceso). */
export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Lunes de la semana que contiene `date` (0 = domingo en getDay()). */
export function startOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(startOfDay(date), diff);
}

/** 42 días (6 semanas) que cubren el mes de `monthDate`, empezando en lunes. */
export function getMonthGridDays(monthDate: Date): Date[] {
  const gridStart = startOfWeek(monthDate);
  return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
}

export function getWeekDays(anchorDate: Date): Date[] {
  const weekStart = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
}

const MONTH_LABELS = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

export function formatMonthLabel(date: Date): string {
  const label = MONTH_LABELS[date.getMonth()];
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${date.getFullYear()}`;
}

export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "short" }).format(date);
}

export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
