// Actividad reciente compartida entre la Agenda y el mini-widget del inicio:
// mezcla creaciones de presupuesto (Quote.createdAt) con cambios de estado
// (QuoteStatusHistory, ya se llena en cada updateQuoteStatus), ordenado desc.

import { prisma } from "@/lib/prisma";
import type { QuoteStatus } from "@/generated/prisma/enums";

export type ActivityEventType = "created" | QuoteStatus;

export type ActivityEventData = {
  id: string;
  type: ActivityEventType;
  clientName: string;
  quoteId: string;
  at: string;
};

export async function getRecentActivity(userId: string, limit: number): Promise<ActivityEventData[]> {
  const fetchLimit = Math.max(limit, 10);

  const [recentQuotes, recentStatusChanges] = await Promise.all([
    prisma.quote.findMany({
      where: { userId },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
    }),
    prisma.quoteStatusHistory.findMany({
      where: { quote: { userId } },
      include: { quote: { include: { client: true } } },
      orderBy: { changedAt: "desc" },
      take: fetchLimit,
    }),
  ]);

  const createdEvents: ActivityEventData[] = recentQuotes.map((quote) => ({
    id: `created-${quote.id}`,
    type: "created",
    clientName: quote.client?.name ?? "Sin cliente",
    quoteId: quote.id,
    at: quote.createdAt.toISOString(),
  }));

  const statusEvents: ActivityEventData[] = recentStatusChanges.map((entry) => ({
    id: `status-${entry.id}`,
    type: entry.status,
    clientName: entry.quote.client?.name ?? "Sin cliente",
    quoteId: entry.quoteId,
    at: entry.changedAt.toISOString(),
  }));

  return [...createdEvents, ...statusEvents]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, limit);
}
