// Agregados de relación comercial de un cliente, cruzando Quote y Event
// (relaciones reales por clientId) con Project (asociación heurística por
// texto, ver client-project-match.ts) — todo de solo lectura.

import { projectMatchesClient } from "@/lib/client-project-match";
import { serializeClient, type ClientSnapshot, type ClientInput } from "@/lib/client-presenter";

export type ClientCardData = ClientSnapshot & {
  projectCount: number;
  quoteCount: number;
  lastContact: string | null;
};

type ProjectRow = { client: string; updatedAt: Date };
type QuoteRow = { clientId: string | null; updatedAt: Date };
type EventRow = { clientId: string | null; startAt: Date };

export function buildClientCards(
  clients: ClientInput[],
  projects: ProjectRow[],
  quotes: QuoteRow[],
  events: EventRow[],
): ClientCardData[] {
  const quoteCountByClientId = new Map<string, number>();
  const quoteLastByClientId = new Map<string, Date>();
  for (const quote of quotes) {
    if (!quote.clientId) continue;
    quoteCountByClientId.set(quote.clientId, (quoteCountByClientId.get(quote.clientId) ?? 0) + 1);
    const prev = quoteLastByClientId.get(quote.clientId);
    if (!prev || quote.updatedAt > prev) quoteLastByClientId.set(quote.clientId, quote.updatedAt);
  }

  const eventLastByClientId = new Map<string, Date>();
  for (const event of events) {
    if (!event.clientId) continue;
    const prev = eventLastByClientId.get(event.clientId);
    if (!prev || event.startAt > prev) eventLastByClientId.set(event.clientId, event.startAt);
  }

  return clients.map((client) => {
    const snapshot = serializeClient(client);
    const matchedProjects = projects.filter((project) => projectMatchesClient(project.client, snapshot));
    const projectLast = matchedProjects.reduce<Date | null>(
      (max, project) => (!max || project.updatedAt > max ? project.updatedAt : max),
      null,
    );
    const quoteLast = quoteLastByClientId.get(client.id) ?? null;
    const eventLast = eventLastByClientId.get(client.id) ?? null;
    const lastContact = [projectLast, quoteLast, eventLast]
      .filter((date): date is Date => date !== null)
      .sort((a, b) => b.getTime() - a.getTime())[0];

    return {
      ...snapshot,
      projectCount: matchedProjects.length,
      quoteCount: quoteCountByClientId.get(client.id) ?? 0,
      lastContact: lastContact ? lastContact.toISOString() : null,
    };
  });
}

export type { ClientSnapshot };
