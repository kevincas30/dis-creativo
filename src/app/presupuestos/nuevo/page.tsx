import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import QuoteEditor from "@/components/quotes/QuoteEditor";

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const { workspace } = await requireWorkspaceMembership(); const { clientId } = await searchParams;
  const [contacts, services, members] = await Promise.all([prisma.client.findMany({ where: { workspaceId: workspace.id, archivedAt: null }, select: { id: true, name: true, email: true, phone: true, instagram: true, responsibleId: true, stage: true }, orderBy: { name: "asc" } }), prisma.service.findMany({ where: { workspaceId: workspace.id, isActive: true }, include: { pricingRules: true }, orderBy: { name: "asc" } }), prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } })]);
  if (clientId && !contacts.some((client) => client.id === clientId)) notFound();
  return <QuoteEditor isNew initial={{ clientId: clientId ?? null, responsibleId: contacts.find((client) => client.id === clientId)?.responsibleId }} contacts={contacts} services={services.map((service) => ({ id: service.id, name: service.name, description: service.description, prices: service.pricingRules.map((price) => ({ currency: price.currency, price: Number(price.basePrice) })) }))} members={members.map((member) => ({ id: member.user.id, name: member.user.displayName }))} />;
}
