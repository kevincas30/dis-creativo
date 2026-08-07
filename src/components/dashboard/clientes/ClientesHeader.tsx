import { Plus, Search } from "lucide-react";
import { CLIENT_STATUS_CONFIG, CLIENT_STATUS_ORDER } from "@/lib/client-status";

export default function ClientesHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  countryFilter,
  onCountryFilterChange,
  countries,
  onCreateClick,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  countryFilter: string;
  onCountryFilterChange: (value: string) => void;
  countries: string[];
  onCreateClick: () => void;
}) {
  return (
    <div className="animate-fade-in-up flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-muted-foreground mt-1 text-sm">Gestiona la relación comercial del estudio</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="liquid-glass flex h-10 w-full items-center gap-2 rounded-xl px-3 sm:w-64">
          <Search className="text-muted-foreground h-4 w-4 shrink-0" strokeWidth={1.75} />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Buscar por nombre, empresa o email..."
            className="placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => onStatusFilterChange(event.target.value)}
          className="liquid-glass h-10 rounded-xl px-3 text-sm text-foreground outline-none"
          aria-label="Filtrar por estado"
        >
          <option value="">Todos los estados</option>
          {CLIENT_STATUS_ORDER.map((status) => (
            <option key={status} value={status}>
              {CLIENT_STATUS_CONFIG[status].label}
            </option>
          ))}
        </select>

        <select
          value={countryFilter}
          onChange={(event) => onCountryFilterChange(event.target.value)}
          className="liquid-glass h-10 rounded-xl px-3 text-sm text-foreground outline-none"
          aria-label="Filtrar por país"
        >
          <option value="">Todos los países</option>
          {countries.map((country) => (
            <option key={country} value={country}>
              {country}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onCreateClick}
          className="shadow-soft inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition-all duration-200 ease-out hover:-translate-y-px hover:bg-blue-500 active:translate-y-0 active:scale-[0.97] active:bg-blue-700 focus-visible:ring-2 focus-visible:ring-blue-400/50 focus-visible:outline-none"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
          Nuevo cliente
        </button>
      </div>
    </div>
  );
}
