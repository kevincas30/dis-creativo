import type { Prisma } from "@/generated/prisma/client";
import type { collectBusinessSnapshot } from "@/lib/business-snapshot";

export type BackfillRootName = "clients" | "services" | "quotes" | "projects" | "workItems" | "events" | "activity";
export type WorkspaceTarget = { workspaceId?: string; workspaceName?: string };
export type WorkspaceBackfillInput = WorkspaceTarget & { dryRun: boolean };
export type WorkspaceBackfillDatabase = {
  $transaction: <T>(callback: (transaction: Prisma.TransactionClient) => Promise<T>) => Promise<T>;
};
export type RootCounts = Record<BackfillRootName, { unassigned: number; target: number; other: number }>;
export type BackfillIssue = { code: string; count: number };

export class WorkspaceBackfillConflictError extends Error {
  constructor(public readonly issues: BackfillIssue[]) {
    super(`Se detectaron conflictos de pertenencia o relaciones: ${issues.map((issue) => `${issue.code} (${issue.count})`).join(", ")}.`);
    this.name = "WorkspaceBackfillConflictError";
  }
}

function addIssue(issues: Map<string, number>, code: string) {
  issues.set(code, (issues.get(code) ?? 0) + 1);
}

function normalizeTarget(input: WorkspaceTarget) {
  const workspaceId = input.workspaceId?.trim() || undefined;
  const workspaceName = input.workspaceName?.trim() || undefined;
  if (Boolean(workspaceId) === Boolean(workspaceName)) {
    throw new Error("Indica exactamente uno de --workspace-id o --workspace-name.");
  }
  return { workspaceId, workspaceName };
}

export function parseWorkspaceBackfillArgs(argv: string[]): WorkspaceBackfillInput {
  let workspaceId: string | undefined;
  let workspaceName: string | undefined;
  let dryRun = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--workspace-id" || argument === "--workspace-name") {
      const value = argv[index + 1]?.trim();
      if (!value || value.startsWith("--")) throw new Error(`${argument} necesita un valor.`);
      if (argument === "--workspace-id") workspaceId = value;
      else workspaceName = value;
      index += 1;
      continue;
    }
    throw new Error(`Argumento no reconocido: ${argument}`);
  }
  return { ...normalizeTarget({ workspaceId, workspaceName }), dryRun };
}

async function resolveWorkspace(transaction: Prisma.TransactionClient, input: WorkspaceTarget) {
  const target = normalizeTarget(input);
  const workspace = target.workspaceId
    ? await transaction.workspace.findUnique({ where: { id: target.workspaceId }, select: { id: true, name: true } })
    : await transaction.workspace.findUnique({ where: { name: target.workspaceName! }, select: { id: true, name: true } });
  if (!workspace) throw new Error("No existe el workspace indicado.");
  return workspace;
}

export async function getBackfillRootCounts(transaction: Prisma.TransactionClient, workspaceId: string): Promise<RootCounts> {
  const count = async (model: "client" | "service" | "quote" | "project" | "workItem" | "event" | "activityRecord") => {
    const delegate = transaction[model] as unknown as { count: (args: { where: object }) => Promise<number> };
    const [unassigned, target, total] = await Promise.all([
      delegate.count({ where: { workspaceId: null } }),
      delegate.count({ where: { workspaceId } }),
      delegate.count({ where: {} }),
    ]);
    return { unassigned, target, other: total - unassigned - target };
  };
  const [clients, services, quotes, projects, workItems, events, activity] = await Promise.all([
    count("client"), count("service"), count("quote"), count("project"), count("workItem"), count("event"), count("activityRecord"),
  ]);
  return { clients, services, quotes, projects, workItems, events, activity };
}

export async function inspectWorkspaceGraph(transaction: Prisma.TransactionClient, targetWorkspaceId: string): Promise<BackfillIssue[]> {
  const [users, clients, services, quotes, projects, periods, workItems, assignments, events, payments, activity, lineItems, notes, messages, history] = await Promise.all([
    transaction.user.findMany({ select: { id: true } }),
    transaction.client.findMany({ select: { id: true, workspaceId: true } }),
    transaction.service.findMany({ select: { id: true, workspaceId: true } }),
    transaction.quote.findMany({ select: { id: true, workspaceId: true, userId: true, clientId: true } }),
    transaction.project.findMany({ select: { id: true, workspaceId: true, userId: true, clientId: true, quoteId: true } }),
    transaction.projectPeriod.findMany({ select: { id: true, projectId: true } }),
    transaction.workItem.findMany({ select: { id: true, workspaceId: true, projectId: true, periodId: true } }),
    transaction.workAssignment.findMany({ select: { id: true, projectId: true, periodId: true, userId: true } }),
    transaction.event.findMany({ select: { id: true, workspaceId: true, userId: true, clientId: true, projectId: true, periodId: true } }),
    transaction.payment.findMany({ select: { id: true, projectId: true, periodId: true, recordedById: true } }),
    transaction.activityRecord.findMany({ select: { id: true, workspaceId: true, actorId: true, clientId: true, projectId: true, periodId: true } }),
    transaction.quoteLineItem.findMany({ select: { id: true, quoteId: true, serviceId: true } }),
    transaction.quoteNote.findMany({ select: { id: true, quoteId: true } }),
    transaction.conversationMessage.findMany({ select: { id: true, quoteId: true } }),
    transaction.quoteStatusHistory.findMany({ select: { id: true, quoteId: true } }),
  ]);
  const issues = new Map<string, number>();
  const usersById = new Set(users.map((row) => row.id));
  const clientsById = new Map(clients.map((row) => [row.id, row.workspaceId]));
  const servicesById = new Map(services.map((row) => [row.id, row.workspaceId]));
  const quotesById = new Map(quotes.map((row) => [row.id, row]));
  const projectsById = new Map(projects.map((row) => [row.id, row]));
  const periodsById = new Map(periods.map((row) => [row.id, row]));
  const rootScope = (scope: string | null) => scope ?? targetWorkspaceId;
  const checkUser = (userId: string) => { if (!usersById.has(userId)) addIssue(issues, "ORPHAN_PUBLIC_PROFILE"); };
  const checkScopedRelation = (scope: string, relatedScope: string | null | undefined, code: string) => {
    if (relatedScope === undefined) addIssue(issues, `${code}_ORPHAN`);
    else if (scope !== rootScope(relatedScope)) addIssue(issues, `${code}_CROSS_WORKSPACE`);
  };
  const checkPeriod = (projectId: string, periodId: string | null, code: string) => {
    if (!periodId) return;
    const period = periodsById.get(periodId);
    if (!period) addIssue(issues, `${code}_PERIOD_ORPHAN`);
    else if (period.projectId !== projectId) addIssue(issues, `${code}_PERIOD_PROJECT_MISMATCH`);
  };

  for (const quote of quotes) {
    const scope = rootScope(quote.workspaceId);
    checkUser(quote.userId);
    if (quote.clientId) checkScopedRelation(scope, clientsById.get(quote.clientId), "QUOTE_CLIENT");
  }
  for (const item of lineItems) {
    const quote = quotesById.get(item.quoteId);
    if (!quote) addIssue(issues, "QUOTE_LINE_QUOTE_ORPHAN");
    else if (item.serviceId) checkScopedRelation(rootScope(quote.workspaceId), servicesById.get(item.serviceId), "QUOTE_LINE_SERVICE");
  }
  for (const child of [...notes, ...messages, ...history]) if (!quotesById.has(child.quoteId)) addIssue(issues, "QUOTE_CHILD_ORPHAN");
  for (const project of projects) {
    const scope = rootScope(project.workspaceId);
    checkUser(project.userId);
    if (project.clientId) checkScopedRelation(scope, clientsById.get(project.clientId), "PROJECT_CLIENT");
    if (project.quoteId) {
      const quote = quotesById.get(project.quoteId);
      checkScopedRelation(scope, quote?.workspaceId, "PROJECT_QUOTE");
    }
  }
  for (const period of periods) if (!projectsById.has(period.projectId)) addIssue(issues, "PERIOD_PROJECT_ORPHAN");
  for (const item of workItems) {
    const project = projectsById.get(item.projectId);
    if (!project) addIssue(issues, "WORK_PROJECT_ORPHAN");
    else checkScopedRelation(rootScope(item.workspaceId), project.workspaceId, "WORK_PROJECT");
    checkPeriod(item.projectId, item.periodId, "WORK");
  }
  for (const assignment of assignments) {
    if (!projectsById.has(assignment.projectId)) addIssue(issues, "ASSIGNMENT_PROJECT_ORPHAN");
    checkPeriod(assignment.projectId, assignment.periodId, "ASSIGNMENT");
    checkUser(assignment.userId);
  }
  for (const event of events) {
    const scope = rootScope(event.workspaceId);
    checkUser(event.userId);
    if (event.clientId) checkScopedRelation(scope, clientsById.get(event.clientId), "EVENT_CLIENT");
    if (event.projectId) checkScopedRelation(scope, projectsById.get(event.projectId)?.workspaceId, "EVENT_PROJECT");
    if (event.projectId) checkPeriod(event.projectId, event.periodId, "EVENT");
    else if (event.periodId) addIssue(issues, "EVENT_PERIOD_WITHOUT_PROJECT");
  }
  for (const payment of payments) {
    if (!projectsById.has(payment.projectId)) addIssue(issues, "PAYMENT_PROJECT_ORPHAN");
    checkPeriod(payment.projectId, payment.periodId, "PAYMENT");
    checkUser(payment.recordedById);
  }
  for (const record of activity) {
    const scope = rootScope(record.workspaceId);
    checkUser(record.actorId);
    if (record.clientId) checkScopedRelation(scope, clientsById.get(record.clientId), "ACTIVITY_CLIENT");
    if (record.projectId) checkScopedRelation(scope, projectsById.get(record.projectId)?.workspaceId, "ACTIVITY_PROJECT");
    if (record.projectId) checkPeriod(record.projectId, record.periodId, "ACTIVITY");
    else if (record.periodId) addIssue(issues, "ACTIVITY_PERIOD_WITHOUT_PROJECT");
  }
  return [...issues.entries()].map(([code, count]) => ({ code, count })).sort((a, b) => a.code.localeCompare(b.code));
}

export async function backfillWorkspace(
  database: WorkspaceBackfillDatabase,
  input: WorkspaceBackfillInput,
) {
  return database.$transaction(async (transaction) => {
    const workspace = await resolveWorkspace(transaction, input);
    const before = await getBackfillRootCounts(transaction, workspace.id);
    const conflicts = await inspectWorkspaceGraph(transaction, workspace.id);
    if (conflicts.length > 0) throw new WorkspaceBackfillConflictError(conflicts);
    if (input.dryRun) return { dryRun: true, workspace, before, updates: null, after: before, issues: [] as BackfillIssue[] };

    const clients = await transaction.client.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const services = await transaction.service.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const quotes = await transaction.quote.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const projects = await transaction.project.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const workItems = await transaction.workItem.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const events = await transaction.event.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const activity = await transaction.activityRecord.updateMany({ where: { workspaceId: null }, data: { workspaceId: workspace.id } });
    const after = await getBackfillRootCounts(transaction, workspace.id);
    const issues = await inspectWorkspaceGraph(transaction, workspace.id);
    if (issues.length > 0 || Object.values(after).some((count) => count.unassigned > 0)) {
      throw new WorkspaceBackfillConflictError(issues.length > 0 ? issues : [{ code: "ROOTS_WITHOUT_WORKSPACE", count: 1 }]);
    }
    return {
      dryRun: false,
      workspace,
      before,
      updates: { clients: clients.count, services: services.count, quotes: quotes.count, projects: projects.count, workItems: workItems.count, events: events.count, activity: activity.count },
      after,
      issues,
    };
  });
}

type BusinessSnapshot = Awaited<ReturnType<typeof collectBusinessSnapshot>>;

function equalIds(expected: string[], actual: string[]) {
  if (expected.length !== actual.length) return false;
  const expectedSet = new Set(expected);
  return actual.every((id) => expectedSet.has(id));
}

export async function validateWorkspaceBackfill(
  database: WorkspaceBackfillDatabase,
  input: WorkspaceTarget & { snapshot: BusinessSnapshot; adminEmail: string; excludedEmail: string },
) {
  return database.$transaction(async (transaction) => {
    const workspace = await resolveWorkspace(transaction, input);
    const [rootCounts, graphIssues, admin, excluded] = await Promise.all([
      getBackfillRootCounts(transaction, workspace.id),
      inspectWorkspaceGraph(transaction, workspace.id),
      transaction.user.findUnique({ where: { email: input.adminEmail }, select: { id: true, email: true } }),
      transaction.user.findUnique({ where: { email: input.excludedEmail }, select: { id: true, email: true } }),
    ]);
    const adminMembership = admin
      ? await transaction.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: admin.id } }, select: { role: true } })
      : null;
    const excludedMembership = excluded
      ? await transaction.workspaceMember.findUnique({ where: { workspaceId_userId: { workspaceId: workspace.id, userId: excluded.id } }, select: { id: true } })
      : null;
    const [users, clients, services, pricingRules, discountRules, quotes, lineItems, notes, messages, statusHistory, projects, periods, workItems, assignments, events, payments, activity] = await Promise.all([
      transaction.user.findMany({ select: { id: true } }), transaction.client.findMany({ select: { id: true } }),
      transaction.service.findMany({ select: { id: true } }), transaction.pricingRule.findMany({ select: { id: true } }),
      transaction.discountRule.findMany({ select: { id: true } }), transaction.quote.findMany({ select: { id: true } }),
      transaction.quoteLineItem.findMany({ select: { id: true } }), transaction.quoteNote.findMany({ select: { id: true } }),
      transaction.conversationMessage.findMany({ select: { id: true } }), transaction.quoteStatusHistory.findMany({ select: { id: true } }),
      transaction.project.findMany({ select: { id: true, quoteId: true } }), transaction.projectPeriod.findMany({ select: { id: true } }),
      transaction.workItem.findMany({ select: { id: true } }), transaction.workAssignment.findMany({ select: { id: true } }),
      transaction.event.findMany({ select: { id: true } }), transaction.payment.findMany({ select: { id: true } }),
      transaction.activityRecord.findMany({ select: { id: true } }),
    ]);
    const snapshot = input.snapshot;
    const expectedIds = {
      users: snapshot.data.users.map((row) => row.id), clients: snapshot.data.clients.map((row) => row.id),
      services: snapshot.data.services.map((row) => row.id), pricingRules: snapshot.data.services.flatMap((row) => row.pricingRules.map((rule) => rule.id)),
      discountRules: snapshot.data.services.flatMap((row) => row.discountRules.map((rule) => rule.id)), quotes: snapshot.data.quotes.map((row) => row.id),
      lineItems: snapshot.data.quotes.flatMap((row) => row.lineItems.map((item) => item.id)), notes: snapshot.data.quotes.flatMap((row) => row.notes.map((item) => item.id)),
      messages: snapshot.data.quotes.flatMap((row) => row.messages.map((item) => item.id)), statusHistory: snapshot.data.quotes.flatMap((row) => row.statusHistory.map((item) => item.id)),
      projects: snapshot.data.projects.map((row) => row.id), periods: snapshot.data.periods.map((row) => row.id),
      workItems: snapshot.data.workItems.map((row) => row.id), assignments: snapshot.data.assignments.map((row) => row.id),
      events: snapshot.data.events.map((row) => row.id), payments: snapshot.data.payments.map((row) => row.id), activity: snapshot.data.activity.map((row) => row.id),
    };
    const actualIds = {
      users: users.map((row) => row.id), clients: clients.map((row) => row.id), services: services.map((row) => row.id),
      pricingRules: pricingRules.map((row) => row.id), discountRules: discountRules.map((row) => row.id), quotes: quotes.map((row) => row.id),
      lineItems: lineItems.map((row) => row.id), notes: notes.map((row) => row.id), messages: messages.map((row) => row.id),
      statusHistory: statusHistory.map((row) => row.id), projects: projects.map((row) => row.id), periods: periods.map((row) => row.id),
      workItems: workItems.map((row) => row.id), assignments: assignments.map((row) => row.id), events: events.map((row) => row.id), payments: payments.map((row) => row.id), activity: activity.map((row) => row.id),
    };
    const changedIds = Object.keys(expectedIds).filter((key) => !equalIds(expectedIds[key as keyof typeof expectedIds], actualIds[key as keyof typeof actualIds]));
    const changedCounts = Object.keys(snapshot.counts).filter((key) => snapshot.counts[key as keyof typeof snapshot.counts] !== actualIds[key as keyof typeof actualIds].length);
    const projectLinksChanged = snapshot.data.projects.some((snapshotProject) => projects.find((project) => project.id === snapshotProject.id)?.quoteId !== snapshotProject.quoteId);
    const acceptedQuoteIds = new Set(snapshot.data.quotes.filter((quote) => quote.status === "ACCEPTED").map((quote) => quote.id));
    const acceptedProjectLinks = snapshot.data.projects.filter((project) => project.quoteId && acceptedQuoteIds.has(project.quoteId)).length;
    const failures = [
      ...Object.entries(rootCounts).filter(([, counts]) => counts.unassigned > 0).map(([name]) => `ROOT_WITHOUT_WORKSPACE:${name}`),
      ...graphIssues.map((issue) => `${issue.code}:${issue.count}`),
      ...(adminMembership?.role === "ADMIN" ? [] : ["OUTLOOK_NOT_ADMIN"]),
      ...(excludedMembership ? ["TEST_GMAIL_HAS_MEMBERSHIP"] : []),
      ...changedCounts.map((name) => `COUNT_CHANGED:${name}`),
      ...changedIds.map((name) => `ID_CHANGED:${name}`),
      ...(projectLinksChanged ? ["PROJECT_QUOTE_LINK_CHANGED"] : []),
    ];
    return {
      ok: failures.length === 0,
      workspace,
      rootCounts,
      graphIssues,
      catalog: { services: actualIds.services.length, pricingRules: actualIds.pricingRules.length, discountRules: actualIds.discountRules.length, expectedServices: snapshot.counts.services, expectedPricingRules: snapshot.counts.pricingRules, expectedDiscountRules: snapshot.counts.discountRules },
      acceptedProjectLinks,
      failures,
    };
  });
}
