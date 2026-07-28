import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

type IconButtonVariant = "default" | "accent";

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  default: "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
  accent: "bg-white text-zinc-900 shadow-soft hover:bg-zinc-100 active:bg-zinc-200",
};

type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: IconButtonVariant };

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ variant = "default", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.9] focus-visible:ring-accent/40 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 ${VARIANT_CLASSES[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);

IconButton.displayName = "IconButton";

export default IconButton;
