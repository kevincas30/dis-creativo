import { CreditCard } from "lucide-react";

export default function ClientPaymentsTab() {
  return (
    <div className="liquid-glass rounded-2xl p-8 text-center">
      <div className="bg-accent-soft mx-auto flex h-10 w-10 items-center justify-center rounded-xl">
        <CreditCard className="text-foreground h-5 w-5" strokeWidth={1.75} />
      </div>
      <p className="mt-3 text-sm font-medium">Aún no hay pagos registrados</p>
      <p className="text-muted-foreground mt-1 text-sm">
        Esta sección está lista para conectarse en cuanto el módulo de Pagos esté disponible.
      </p>
    </div>
  );
}
