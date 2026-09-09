// Convierte un Client de Prisma a un objeto plano serializable en JSON, para
// el módulo Clientes (CRM del dashboard principal). "name" sigue siendo el
// nombre completo que usa Presupuestos IA — displayName prioriza
// firstName+lastName (clientes creados desde el CRM) y cae a name (clientes
// creados desde el flujo de presupuestos, que nunca llenan firstName/lastName).

import type { ClientStage, ClientStatus, Currency, LeadSource, ProspectStatus } from "@/generated/prisma/enums";

export type ClientInput = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  address: string | null;
  website: string | null;
  defaultCurrency: Currency | null;
  status: ClientStatus;
  stage: ClientStage;
  prospectStatus: ProspectStatus;
  source: LeadSource | null;
  responsibleId: string | null;
  responsible?: { id: string; displayName: string } | null;
  instagram: string | null;
  convertedAt: Date | null;
  nextFollowUpEvent?: { id: string; title: string; startAt: Date; endAt: Date } | null;
  notes: string | null;
  archivedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ClientSnapshot = ReturnType<typeof serializeClient>;

export function clientDisplayName(client: { name: string; firstName: string | null; lastName: string | null }): string {
  const composed = [client.firstName, client.lastName].filter(Boolean).join(" ").trim();
  return composed.length > 0 ? composed : client.name;
}

export function clientInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase() || "?";
}

export function serializeClient(client: ClientInput) {
  const displayName = clientDisplayName(client);
  return {
    id: client.id,
    name: client.name,
    displayName,
    initials: clientInitials(displayName),
    firstName: client.firstName,
    lastName: client.lastName,
    company: client.company,
    email: client.email,
    phone: client.phone,
    country: client.country,
    address: client.address,
    website: client.website,
    defaultCurrency: client.defaultCurrency,
    status: client.status,
    stage: client.stage,
    prospectStatus: client.prospectStatus,
    source: client.source,
    responsibleId: client.responsibleId,
    responsible: client.responsible ?? null,
    instagram: client.instagram,
    convertedAt: client.convertedAt?.toISOString() ?? null,
    nextFollowUp: client.nextFollowUpEvent
      ? { id: client.nextFollowUpEvent.id, title: client.nextFollowUpEvent.title, startAt: client.nextFollowUpEvent.startAt.toISOString(), endAt: client.nextFollowUpEvent.endAt.toISOString() }
      : null,
    notes: client.notes,
    archivedAt: client.archivedAt?.toISOString() ?? null,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
