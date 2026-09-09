"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import CreateClientModal from "@/components/dashboard/clientes/CreateClientModal";
import { LEAD_SOURCE_LABEL, PROSPECT_STATUS_LABEL, followUpLabel } from "@/lib/client-commercial";
import { useMobileHeaderAction } from "@/components/dashboard/MobileHeaderActionContext";
import type { ClientCardData } from "@/lib/client-relations";
import type { ClientStage } from "@/generated/prisma/enums";

type View = "prospects" | "clients" | "archived";
type ProspectFilter = "ALL" | "NEW" | "CONTACTED" | "QUOTE" | "NO_FOLLOW_UP" | "OVERDUE" | "LOST";

const viewLabel: Record<View, string> = { prospects: "Prospectos", clients: "Clientes", archived: "Archivados" };

function normalized(value: string) { return value.trim().toLocaleLowerCase(); }

export default function ClientesPageClient({ view, clients, members }: { view: View; clients: ClientCardData[]; members: { id: string; name: string }[] }) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ProspectFilter>("ALL");
  const [createStage, setCreateStage] = useState<ClientStage | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  useMobileHeaderAction(<button type="button" onClick={() => setMenuOpen((open) => !open)} aria-label="Nuevo contacto" className="shadow-soft flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white"><Plus className="h-4 w-4" /></button>);

  const rows = useMemo(() => clients.filter((client) => {
    if (view === "prospects" && client.stage !== "PROSPECT") return false;
    if (view === "clients" && client.stage !== "CLIENT") return false;
    const term = normalized(search);
    if (term && ![client.displayName, client.company ?? "", client.email ?? "", client.phone ?? "", client.instagram ?? ""].some((value) => normalized(value).includes(term))) return false;
    if (view !== "prospects") return true;
    const followUp = client.nextFollowUp?.startAt ?? null;
    const overdue = followUp && new Date(followUp).getTime() < new Date(new Date().toDateString()).getTime();
    if (filter === "NO_FOLLOW_UP") return !followUp;
    if (filter === "OVERDUE") return Boolean(overdue);
    return filter === "ALL" || client.prospectStatus === filter;
  }), [clients, filter, search, view]);

  const tabs: View[] = ["prospects", "clients", "archived"];
  return <div className="space-y-5">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">Clientes</h1><p className="text-muted-foreground mt-1 text-sm">Contactos y seguimiento comercial compartido</p></div><div className="relative hidden md:block"><button type="button" onClick={() => setMenuOpen((open) => !open)} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white"><Plus className="h-4 w-4" />Nuevo</button>{menuOpen ? <div className="border-surface-border bg-surface-solid absolute right-0 z-10 mt-2 w-48 rounded-xl border p-1 shadow-xl"><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => { setCreateStage("PROSPECT"); setMenuOpen(false); }}>Nuevo prospecto</button><button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-black/5" onClick={() => { setCreateStage("CLIENT"); setMenuOpen(false); }}>Nuevo cliente</button></div> : null}</div></div>
    {menuOpen ? <div className="border-surface-border bg-surface-solid rounded-xl border p-2 md:hidden"><button className="w-full rounded-lg px-3 py-2 text-left text-sm" onClick={() => { setCreateStage("PROSPECT"); setMenuOpen(false); }}>Nuevo prospecto</button><button className="w-full rounded-lg px-3 py-2 text-left text-sm" onClick={() => { setCreateStage("CLIENT"); setMenuOpen(false); }}>Nuevo cliente</button></div> : null}
    <nav className="border-surface-border flex gap-1 border-b" aria-label="Vistas de contactos">{tabs.map((tab) => <Link href={`/clientes?view=${tab}`} key={tab} className={`px-3 py-2 text-sm ${view === tab ? "border-b-2 border-blue-500 font-medium" : "text-muted-foreground"}`}>{viewLabel[tab]} {tab === "prospects" ? `(${clients.filter((c) => c.stage === "PROSPECT").length})` : ""}</Link>)}</nav>
    <div className="flex flex-col gap-2 sm:flex-row"><div className="liquid-glass flex h-10 flex-1 items-center gap-2 rounded-xl px-3"><Search className="text-muted-foreground h-4 w-4" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar contacto" className="w-full bg-transparent text-sm outline-none" /></div>{view === "prospects" ? <div className="flex flex-wrap gap-1">{(["ALL", "NEW", "CONTACTED", "QUOTE", "NO_FOLLOW_UP", "OVERDUE", "LOST"] as ProspectFilter[]).map((value) => <button type="button" key={value} onClick={() => setFilter(value)} className={`rounded-lg px-2.5 py-2 text-xs ${filter === value ? "bg-blue-600 text-white" : "bg-surface-solid text-muted-foreground"}`}>{({ ALL: "Todos", NEW: "Nuevos", CONTACTED: "Contactados", QUOTE: "Con presupuesto", NO_FOLLOW_UP: "Sin seguimiento", OVERDUE: "Vencidos", LOST: "Perdidos" } as Record<ProspectFilter, string>)[value]}</button>)}</div> : null}</div>
    <div className="border-surface-border overflow-hidden rounded-2xl border"><div className="hidden grid-cols-[minmax(180px,2fr)_minmax(150px,1.5fr)_120px_120px_150px] gap-4 border-b px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground md:grid">{view === "prospects" ? <><span>Nombre</span><span>Contacto</span><span>Canal</span><span>Estado</span><span>Responsable · seguimiento</span></> : <><span>Nombre</span><span>Contacto</span><span>Proyectos</span><span>Responsable</span><span>Última actividad</span></>}</div>{rows.map((client) => <Link href={`/clientes/${client.id}`} key={client.id} className="block border-b border-surface-border px-4 py-3 last:border-0 hover:bg-black/[0.03]"><div className="grid gap-1 md:grid-cols-[minmax(180px,2fr)_minmax(150px,1.5fr)_120px_120px_150px] md:gap-4"><div><p className="font-medium">{client.displayName}</p><p className="text-muted-foreground text-xs">{client.company ?? (client.stage === "PROSPECT" ? "Prospecto" : "Cliente")}</p></div><div className="text-sm"><p>{client.email ?? client.phone ?? (client.instagram ? `@${client.instagram.replace(/^@/, "")}` : "Sin contacto")}</p></div>{view === "prospects" ? <><span className="text-sm">{client.source ? LEAD_SOURCE_LABEL[client.source] : "—"}</span><span className="text-sm">{PROSPECT_STATUS_LABEL[client.prospectStatus]}</span><span className="text-sm">{client.responsible?.displayName ?? "Sin responsable"} · <span className={followUpLabel(client.nextFollowUp?.startAt ?? null) === "Vencido" ? "text-red-400" : ""}>{followUpLabel(client.nextFollowUp?.startAt ?? null)}</span></span></> : <><span className="text-sm">{client.projectCount} activos</span><span className="text-sm">{client.responsible?.displayName ?? "Sin responsable"}</span><span className="text-sm">{client.lastContact ? new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short" }).format(new Date(client.lastContact)) : "Sin actividad"}</span></>}</div></Link>)}{rows.length === 0 ? <div className="p-10 text-center text-sm text-muted-foreground">No hay registros para esta vista.</div> : null}</div>
    {createStage ? <CreateClientModal isOpen onClose={() => setCreateStage(null)} stage={createStage} members={members} /> : null}
  </div>;
}
