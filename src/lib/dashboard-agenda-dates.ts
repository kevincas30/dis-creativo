import { madridDate } from "@/lib/agenda-time";

// Utilidades de fecha para Agenda comercial (dashboard) — cálculo de grillas
// de mes/semana con Date nativo, sin librerías. Independiente de
// src/lib/agenda-dates.ts (que pertenece a la agenda interna de Presupuestos
// IA). Semana empieza en lunes (convención española/mexicana).

export function addDays(date: Date, amount: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function addWeeks(date: Date, amount: number): Date {
  return addDays(date, amount * 7);
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Clave estable para agrupar eventos por día en un Map. */
export function dayKey(date: Date): string {
  return madridDate(date);
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
  const gridStart = startOfWeek(new Date(monthDate.getFullYear(), monthDate.getMonth(), 1));
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

export const WEEKDAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];

export function formatMonthLabel(date: Date): string {
  const label = MONTH_LABELS[date.getMonth()];
  return `${label.charAt(0).toUpperCase()}${label.slice(1)} ${date.getFullYear()}`;
}

export function formatDayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatWeekRangeLabel(days: Date[]): string {
  const first = days[0];
  const last = days[days.length - 1];
  const sameMonth = first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear();
  const monthLabel = MONTH_LABELS[last.getMonth()];
  if (sameMonth) {
    return `${first.getDate()}–${last.getDate()} de ${monthLabel} ${last.getFullYear()}`;
  }
  const firstMonthLabel = MONTH_LABELS[first.getMonth()];
  return `${first.getDate()} de ${firstMonthLabel} – ${last.getDate()} de ${monthLabel} ${last.getFullYear()}`;
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit" }).format(date);
}

/** Solo el nombre del día ("Viernes") — para el encabezado grande de la vista Día móvil. */
export function formatWeekdayLabel(date: Date): string {
  const label = new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "agosto" — para el encabezado grande de la vista Día móvil. */
export function formatMonthNameLabel(date: Date): string {
  return MONTH_LABELS[date.getMonth()];
}

/** "0:00", "1:00"... — etiquetas de la regla horaria del timeline. */
export function formatHourLabel(hour: number): string {
  return new Intl.DateTimeFormat("es-MX", { hour: "numeric" }).format(new Date(2000, 0, 1, hour));
}

/** Formato "YYYY-MM-DD" en hora local, listo para un <input type="date">. */
export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
