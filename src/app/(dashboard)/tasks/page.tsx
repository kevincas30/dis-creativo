import { ListChecks } from "lucide-react";
import ComingSoon from "@/components/dashboard/ComingSoon";

export default function TasksPage() {
  return (
    <ComingSoon
      icon={ListChecks}
      title="Tareas"
      description="Este espacio reunirá los pendientes de tus proyectos. El módulo aún no está disponible; mientras tanto, consulta en Inicio los compromisos de hoy y los proyectos que necesitan atención."
    />
  );
}
