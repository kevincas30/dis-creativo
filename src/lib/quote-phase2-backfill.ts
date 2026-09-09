import type { PrismaClient } from "@/generated/prisma/client";

export type QuotePhase2BackfillResult = { quotes: number; histories: number };

/** Completa solo metadatos nuevos de Fase 2; no toca IDs, importes, líneas ni estados históricos. */
export async function backfillQuotePhase2(database: PrismaClient, workspaceId: string, dryRun = false): Promise<QuotePhase2BackfillResult> {
  return database.$transaction(async (tx) => {
    const quotes = await tx.quote.findMany({ where: { workspaceId, responsibleId: null }, select: { id: true, userId: true, client: { select: { responsibleId: true } } } });
    const histories = await tx.quoteStatusHistory.findMany({ where: { changedById: null, quote: { workspaceId } }, select: { id: true, quote: { select: { userId: true } } } });
    if (!dryRun) {
      await Promise.all(quotes.map((quote) => tx.quote.update({ where: { id: quote.id }, data: { responsibleId: quote.client?.responsibleId ?? quote.userId } })));
      await Promise.all(histories.map((entry) => tx.quoteStatusHistory.update({ where: { id: entry.id }, data: { changedById: entry.quote.userId } })));
    }
    return { quotes: quotes.length, histories: histories.length };
  });
}

export async function verifyQuotePhase2Backfill(database: PrismaClient, workspaceId: string) {
  const [missingResponsible, missingActors, foreignClient, foreignEvents] = await Promise.all([
    database.quote.count({ where: { workspaceId, responsibleId: null } }),
    database.quoteStatusHistory.count({ where: { changedById: null, quote: { workspaceId } } }),
    database.quote.count({ where: { workspaceId, client: { workspaceId: { not: workspaceId } } } }),
    database.event.count({ where: { workspaceId, quoteId: { not: null }, quote: { workspaceId: { not: workspaceId } } } }),
  ]);
  return { ok: missingResponsible === 0 && missingActors === 0 && foreignClient === 0 && foreignEvents === 0, missingResponsible, missingActors, foreignClient, foreignEvents };
}
