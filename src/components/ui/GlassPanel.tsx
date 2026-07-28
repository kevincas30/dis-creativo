import type { HTMLAttributes } from "react";

export default function GlassPanel({ className = "", children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`glass rounded-2xl shadow-soft ${className}`} {...props}>
      {children}
    </div>
  );
}
