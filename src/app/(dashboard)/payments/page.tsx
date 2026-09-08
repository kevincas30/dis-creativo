import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { getPaymentAccounts } from "@/lib/payment-accounts";
import PaymentAccounts from "@/components/dashboard/PaymentAccounts";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
export default async function PaymentsPage() {
  const { workspace } = await requireWorkspaceMembership();
  const accounts = await getPaymentAccounts(workspace.id);
  return <div className="relative h-full overflow-y-auto px-6 py-10 sm:px-10 lg:px-16"><DashboardBackground /><div className="mx-auto max-w-5xl space-y-5"><h1 className="text-2xl font-semibold">Pagos</h1><p className="text-sm text-muted-foreground">Importes recibidos y saldos por proyecto único o periodo. Registra cada pago desde su ficha.</p><PaymentAccounts accounts={accounts} /></div></div>;
}
