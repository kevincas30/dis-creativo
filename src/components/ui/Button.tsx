import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: "bg-white text-zinc-900 shadow-soft hover:bg-zinc-100 active:bg-zinc-200",
  secondary: "glass text-foreground hover:border-accent/30",
  ghost: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  danger: "bg-red-500 text-white shadow-soft hover:bg-red-600 active:bg-red-700",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant };

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.97] focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
