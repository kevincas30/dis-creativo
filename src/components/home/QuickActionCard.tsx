import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type QuickActionCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  description: string;
};

export default function QuickActionCard({
  icon: Icon,
  label,
  description,
  disabled,
  className = "",
  ...props
}: QuickActionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`glass group focus-visible:ring-accent/40 flex items-center gap-3 rounded-2xl p-4 text-left shadow-soft transition-all duration-200 ease-out focus-visible:ring-2 focus-visible:outline-none ${
        disabled
          ? "cursor-not-allowed opacity-50"
          : "hover:border-accent/30 hover:shadow-elevated active:scale-[0.98] cursor-pointer hover:-translate-y-px active:translate-y-0"
      } ${className}`}
      {...props}
    >
      <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105">
        <Icon className="text-foreground h-5 w-5" strokeWidth={1.75} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="text-muted-foreground truncate text-xs">{description}</p>
      </div>
    </button>
  );
}
