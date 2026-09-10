import { ChevronDown } from "lucide-react";
import type { ComponentProps } from "react";

/** Native select with a consistent, accessible visual indicator. */
export default function Select({ className = "", children, ...props }: ComponentProps<"select">) {
  return (
    <span className="relative block">
      <select {...props} className={`appearance-none pr-10 ${className}`}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.8} />
    </span>
  );
}
