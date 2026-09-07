// Integer cents keep financial totals exact in both server and browser code.
function cents(value: string) {
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
}
function money(value: bigint) { return `${value / BigInt(100)}.${String(value % BigInt(100)).padStart(2, "0")}`; }
export function financialSummary(total: string | null, amounts: string[], dueDate: string | null, today: string) {
  const zero = BigInt(0);
  const paid = amounts.reduce((sum, amount) => sum + cents(amount), zero);
  const agreed = total === null ? null : cents(total);
  const outstanding = agreed === null ? null : agreed > paid ? agreed - paid : zero;
  const credit = agreed !== null && paid > agreed ? paid - agreed : zero;
  const settled = agreed !== null && paid > zero && paid >= agreed;
  const overdue = !settled && outstanding !== null && outstanding > zero && !!dueDate && dueDate.slice(0, 10) < today;
  return { status: settled ? "Pagado" : overdue ? "Vencido" : paid > zero ? "Parcial" : "Pendiente", paid: money(paid), outstanding: outstanding === null ? null : money(outstanding), credit: money(credit) };
}
export function nextMonthDate(value: string) {
  const date = new Date(value.slice(0, 10) + "T00:00:00Z");
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}
