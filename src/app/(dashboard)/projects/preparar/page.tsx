import { notFound, redirect } from "next/navigation";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import ProjectPreparationWizard from "@/components/dashboard/projects/ProjectPreparationWizard";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { proposedTasksFromQuote } from "@/lib/project-preparation-service";

export default async function PrepareProjectPage({ searchParams }: { searchParams: Promise<{ quoteId?: string }> }) {
  const { quoteId } = await searchParams;
  const { workspace } = await requireWorkspaceMembership();
  if (!quoteId) notFound();
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId: workspace.id }, include: { client: { select: { id: true, name: true } }, lineItems: { orderBy: { sortOrder: "asc" } }, projects: { select: { id: true } } } });
  if (!quote || quote.status !== "ACCEPTED" || !quote.client) notFound();
  if (quote.projects[0]) redirect(`/projects/${quote.projects[0].id}`);
  const members = await prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, select: { user: { select: { id: true, displayName: true } } }, orderBy: { user: { displayName: "asc" } } });
  const total = quote.total?.toFixed(2) ?? "0.00";
  const deposit = quote.depositKind === "NONE" ? 0 : quote.depositKind === "FULL" ? Number(total) : quote.depositKind === "FIXED" ? Math.min(Number(total), Number(quote.depositValue)) : Number(total) * Number(quote.depositValue) / 100;
  return <div className="relative flex h-full flex-col overflow-y-auto px-4 py-6 sm:px-10 lg:px-16"><DashboardBackground /><ProjectPreparationWizard quote={{ id: quote.id, client: quote.client, total, currency: quote.currency ?? "EUR", depositExpected: deposit.toFixed(2), lines: proposedTasksFromQuote(quote.lineItems) }} members={members.map(({ user }) => ({ id: user.id, name: user.displayName }))} /></div>;
}
