import type { QuoteStatus } from "@/generated/prisma/enums";
import { QUOTE_STATUS_CONFIG } from "@/lib/quote-status";

export default function StatusDot({ status }: { status: QuoteStatus }) {
  const config = QUOTE_STATUS_CONFIG[status];

  return (
    <span
      className={`h-1.5 w-1.5 shrink-0 rounded-full ${config.dotClassName}`}
      title={config.label}
      aria-label={config.label}
    />
  );
}
