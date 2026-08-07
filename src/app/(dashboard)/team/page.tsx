import { UsersRound } from "lucide-react";
import ComingSoon from "@/components/dashboard/ComingSoon";

export default function TeamPage() {
  return (
    <ComingSoon
      icon={UsersRound}
      title="Equipo"
      description="Miembros del estudio, roles y carga de trabajo. Estamos preparando este módulo."
    />
  );
}
