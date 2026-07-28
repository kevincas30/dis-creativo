import Image from "next/image";
import { Plus, FileText, BarChart3, Settings } from "lucide-react";
import { createDraftQuote } from "./quotes/actions";
import { getCurrentUser } from "@/lib/current-user";
import QuickActionCard from "@/components/home/QuickActionCard";
import AuroraBackground from "@/components/home/AuroraBackground";

function firstNameOf(displayName: string) {
  const first = displayName.trim().split(/\s+/)[0] ?? displayName;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export default async function Home() {
  const user = await getCurrentUser();
  const name = firstNameOf(user.displayName);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-12">
      <AuroraBackground />

      <div className="animate-fade-in-up space-y-3 text-center">
        <Image
          src="/logo.svg"
          alt="Diseño Creativo"
          width={56}
          height={56}
          className="shadow-soft mx-auto rounded-2xl"
        />
        <h1 className="text-3xl font-semibold tracking-tight">Hola {name} 👋</h1>
        <p className="text-muted-foreground text-base">¿Qué quieres hacer hoy?</p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <form action={createDraftQuote} className="contents">
          <QuickActionCard
            type="submit"
            icon={Plus}
            label="Nuevo presupuesto"
            description="Arranca una conversación guiada"
            className="animate-fade-in-up w-full"
            style={{ animationDelay: "100ms" }}
          />
        </form>
        <QuickActionCard
          icon={FileText}
          label="Presupuestos pendientes"
          description="Próximamente"
          disabled
          className="animate-fade-in-up"
          style={{ animationDelay: "140ms" }}
        />
        <QuickActionCard
          icon={BarChart3}
          label="Estadísticas"
          description="Próximamente"
          disabled
          className="animate-fade-in-up"
          style={{ animationDelay: "180ms" }}
        />
        <QuickActionCard
          icon={Settings}
          label="Configuración"
          description="Próximamente"
          disabled
          className="animate-fade-in-up"
          style={{ animationDelay: "220ms" }}
        />
      </div>
    </div>
  );
}
