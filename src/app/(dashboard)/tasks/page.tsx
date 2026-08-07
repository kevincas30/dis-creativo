import { ListChecks } from "lucide-react";
import ComingSoon from "@/components/dashboard/ComingSoon";

export default function TasksPage() {
  return (
    <ComingSoon
      icon={ListChecks}
      title="Tareas"
      description="Pendientes del equipo organizados por proyecto y prioridad. Estamos preparando este módulo."
    />
  );
}
