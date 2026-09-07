import { prisma } from "@/lib/prisma";
import type { PaymentAccount } from "@/components/dashboard/PaymentAccounts";
export async function getPaymentAccounts(userId: string, clientId?: string): Promise<PaymentAccount[]> {
  const projects = await prisma.project.findMany({ where: { userId, ...(clientId ? { clientId } : {}) }, include: { periods: { orderBy: { startDate: "desc" } }, payments: { orderBy: { paidAt: "desc" } } }, orderBy: { updatedAt: "desc" } });
  return projects.flatMap((p) => (p.kind === "RECURRING" ? p.periods : [p]).map((scope) => {
    const periodId = p.kind === "RECURRING" ? scope.id : null;
    return { id: scope.id, projectId: p.id, periodId, name: "label" in scope ? `${p.name} · ${scope.label}` : p.name, total: scope.agreedTotal?.toFixed(2) ?? null, currency: scope.currency, dueDate: scope.paymentDueDate?.toISOString() ?? null, payments: p.payments.filter((payment) => payment.periodId === periodId).map((payment) => ({ amount: payment.amount.toFixed(2), paidAt: payment.paidAt.toISOString(), note: payment.note })) };
  }));
}
