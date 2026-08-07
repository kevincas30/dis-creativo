import type { LucideIcon } from "lucide-react";
import DashboardBackground from "@/components/dashboard/DashboardBackground";

export default function ComingSoon({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="relative flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 sm:px-10">
      <DashboardBackground />

      <div
        className="liquid-glass animate-fade-in-up flex w-full max-w-md flex-col items-center gap-4 rounded-2xl p-8 text-center"
        style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
      >
        <div className="bg-accent-soft flex h-12 w-12 shrink-0 items-center justify-center rounded-xl">
          <Icon className="text-foreground h-6 w-6" strokeWidth={1.75} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>

        <span className="border-surface-border text-muted-foreground rounded-full border px-3 py-1 text-xs font-medium tracking-wide uppercase">
          Próximamente
        </span>
      </div>
    </div>
  );
}
