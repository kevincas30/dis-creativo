import { CreditCard } from "lucide-react";
import ComingSoon from "@/components/dashboard/ComingSoon";

export default function PaymentsPage() {
  return (
    <ComingSoon
      icon={CreditCard}
      title="Pagos"
      description="Cobros, facturas y estado de pagos de cada cliente. Estamos preparando este módulo."
    />
  );
}
