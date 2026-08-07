"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Globe, Pencil, X, Plus, FolderPlus, CalendarPlus } from "lucide-react";
import Button from "@/components/ui/Button";
import { CLIENT_STATUS_CONFIG } from "@/lib/client-status";
import { updateClient } from "@/app/(dashboard)/clientes/actions";
import { createDraftQuote } from "@/app/presupuestos/quotes/actions";
import ClientFormFields from "@/components/dashboard/clientes/ClientFormFields";
import ClientSummaryTiles, { type ClientSummary } from "@/components/dashboard/clientes/ClientSummaryTiles";
import ClientTabs, { type ClientTabId } from "@/components/dashboard/clientes/ClientTabs";
import ClientOverviewTab from "@/components/dashboard/clientes/tabs/ClientOverviewTab";
import ClientProjectsTab from "@/components/dashboard/clientes/tabs/ClientProjectsTab";
import ClientQuotesTab, { type ClientQuoteRow } from "@/components/dashboard/clientes/tabs/ClientQuotesTab";
import ClientAgendaTab from "@/components/dashboard/clientes/tabs/ClientAgendaTab";
import ClientPaymentsTab from "@/components/dashboard/clientes/tabs/ClientPaymentsTab";
import ClientDocumentsTab from "@/components/dashboard/clientes/tabs/ClientDocumentsTab";
import ClientActivityTab, { type ClientActivityItem } from "@/components/dashboard/clientes/tabs/ClientActivityTab";
import CreateProjectModal from "@/components/dashboard/projects/CreateProjectModal";
import CreateEventModal from "@/components/dashboard/agenda/CreateEventModal";
import type { ClientSnapshot } from "@/lib/client-presenter";
import type { ProjectSnapshot } from "@/lib/project-presenter";
import type { EventSnapshot } from "@/lib/event-presenter";

export default function ClientDetailClient({
  client: initialClient,
  summary,
  projects,
  quotes,
  events: initialEvents,
  activity,
  allClients,
  allProjects,
}: {
  client: ClientSnapshot;
  summary: ClientSummary;
  projects: ProjectSnapshot[];
  quotes: ClientQuoteRow[];
  events: EventSnapshot[];
  activity: ClientActivityItem[];
  allClients: { id: string; name: string }[];
  allProjects: { id: string; name: string }[];
}) {
  const [client, setClient] = useState(initialClient);
  const [events, setEvents] = useState(initialEvents);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ClientTabId>("overview");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  const config = CLIENT_STATUS_CONFIG[client.status];

  function handleEditSubmit(formData: FormData) {
    startTransition(async () => {
      const updated = await updateClient(client.id, formData);
      setClient(updated);
      setIsEditing(false);
    });
  }

  function handleEventCreated(event: EventSnapshot) {
    setEvents((prev) => [event, ...prev]);
  }

  return (
    <div className="space-y-6">
      <Link
        href="/clientes"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors duration-150"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
        Clientes
      </Link>

      <div
        className="liquid-glass animate-fade-in-up rounded-2xl p-6"
        style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)" } as React.CSSProperties}
      >
        {isEditing ? (
          <form action={handleEditSubmit}>
            <ClientFormFields
              defaultValues={{
                firstName: client.firstName,
                lastName: client.lastName,
                company: client.company,
                email: client.email,
                phone: client.phone,
                country: client.country,
                address: client.address,
                website: client.website,
                notes: client.notes,
                status: client.status,
              }}
            />

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                <X className="h-4 w-4" strokeWidth={1.75} />
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={isPending}>
                {isPending ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-semibold tracking-tight">{client.displayName}</h1>
                <p className="text-muted-foreground mt-0.5 text-sm">{client.company ?? "Sin empresa"}</p>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.badgeClassName}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
                {config.label}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {client.email ?? "Sin email"}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {client.phone ?? "Sin teléfono"}
              </span>
              <span className="text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                {client.country ?? "Sin país"}
              </span>
              {client.website ? (
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:opacity-80 flex items-center gap-1.5 transition-opacity"
                >
                  <Globe className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
                  Sitio web
                </a>
              ) : null}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => setIsEditing(true)}>
                <Pencil className="h-4 w-4" strokeWidth={1.75} />
                Editar cliente
              </Button>
              <Button type="button" variant="secondary" onClick={() => setIsProjectModalOpen(true)}>
                <FolderPlus className="h-4 w-4" strokeWidth={1.75} />
                Nuevo proyecto
              </Button>
              <form action={createDraftQuote}>
                <Button type="submit" variant="secondary">
                  <Plus className="h-4 w-4" strokeWidth={1.75} />
                  Nuevo presupuesto
                </Button>
              </form>
              <Button type="button" variant="secondary" onClick={() => setIsEventModalOpen(true)}>
                <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
                Nueva reunión
              </Button>
            </div>
          </>
        )}
      </div>

      <ClientSummaryTiles summary={summary} />

      <div className="space-y-4">
        <ClientTabs active={activeTab} onChange={setActiveTab} />

        {activeTab === "overview" ? <ClientOverviewTab client={client} /> : null}
        {activeTab === "projects" ? <ClientProjectsTab projects={projects} /> : null}
        {activeTab === "quotes" ? <ClientQuotesTab quotes={quotes} /> : null}
        {activeTab === "agenda" ? <ClientAgendaTab events={events} /> : null}
        {activeTab === "payments" ? <ClientPaymentsTab /> : null}
        {activeTab === "documents" ? <ClientDocumentsTab /> : null}
        {activeTab === "activity" ? <ClientActivityTab items={activity} /> : null}
      </div>

      <CreateProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} defaultClient={client.displayName} />
      <CreateEventModal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        clients={allClients}
        projects={allProjects}
        defaultClientId={client.id}
        onCreated={handleEventCreated}
      />
    </div>
  );
}
