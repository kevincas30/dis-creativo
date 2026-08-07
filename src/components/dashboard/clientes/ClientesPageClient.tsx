"use client";

import { useMemo, useState } from "react";
import ClientesHeader from "@/components/dashboard/clientes/ClientesHeader";
import ClientCard from "@/components/dashboard/clientes/ClientCard";
import ClientesEmptyState from "@/components/dashboard/clientes/ClientesEmptyState";
import CreateClientModal from "@/components/dashboard/clientes/CreateClientModal";
import type { ClientCardData } from "@/lib/client-relations";

function normalize(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "");
}

export default function ClientesPageClient({ clients }: { clients: ClientCardData[] }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  const countries = useMemo(
    () => Array.from(new Set(clients.map((client) => client.country).filter((country): country is string => !!country))).sort(),
    [clients],
  );

  const filteredClients = useMemo(() => {
    const term = normalize(search);
    return clients.filter((client) => {
      if (statusFilter && client.status !== statusFilter) return false;
      if (countryFilter && client.country !== countryFilter) return false;
      if (
        term &&
        !normalize(client.displayName).includes(term) &&
        !normalize(client.company ?? "").includes(term) &&
        !normalize(client.email ?? "").includes(term)
      ) {
        return false;
      }
      return true;
    });
  }, [clients, search, statusFilter, countryFilter]);

  if (clients.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="animate-fade-in-up">
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1 text-sm">Gestiona la relación comercial del estudio</p>
        </div>
        <ClientesEmptyState onCreate={() => setIsCreateOpen(true)} />
        <CreateClientModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClientesHeader
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        countryFilter={countryFilter}
        onCountryFilterChange={setCountryFilter}
        countries={countries}
        onCreateClick={() => setIsCreateOpen(true)}
      />

      {filteredClients.length === 0 ? (
        <div className="liquid-glass rounded-2xl p-8 text-center">
          <p className="text-muted-foreground text-sm">Ningún cliente coincide con la búsqueda o los filtros.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      )}

      <CreateClientModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}
