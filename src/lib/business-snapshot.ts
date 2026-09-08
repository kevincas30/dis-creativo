import { createHash } from "node:crypto";
import { chmod, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PrismaClient } from "@/generated/prisma/client";

export const BUSINESS_SNAPSHOT_VERSION = 1;

const userSelect = {
  id: true,
  email: true,
  displayName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function collectBusinessSnapshot(prisma: PrismaClient) {
  const [users, clients, services, quotes, projects, periods, workItems, assignments, events, payments, activity] =
    await Promise.all([
      prisma.user.findMany({ select: userSelect, orderBy: { id: "asc" } }),
      prisma.client.findMany({
        select: {
          id: true, name: true, firstName: true, lastName: true, company: true, email: true, phone: true,
          country: true, address: true, website: true, defaultCurrency: true, status: true, notes: true,
          createdAt: true, updatedAt: true, archivedAt: true,
        },
        orderBy: { id: "asc" },
      }),
      prisma.service.findMany({
        select: {
          id: true, code: true, name: true, category: true, description: true, isActive: true, createdAt: true,
          updatedAt: true,
          pricingRules: { select: { id: true, serviceId: true, currency: true, basePrice: true, unitLabel: true, notes: true, updatedAt: true }, orderBy: { id: "asc" } },
          discountRules: { select: { id: true, serviceId: true, minQty: true, maxQty: true, percent: true }, orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.quote.findMany({
        select: {
          id: true, userId: true, clientId: true, currency: true, taxRatePercent: true, status: true,
          questionnaireAnswers: true, subtotal: true, discountType: true, discountValue: true, discountReason: true,
          taxAmount: true, total: true, calculationExplanation: true, salesDescription: true, termsAndConditions: true,
          deliveryTimeline: true, issuedAt: true, validUntil: true, sentAt: true, approvedAt: true, paidAt: true,
          followUpDate: true, createdAt: true, updatedAt: true,
          lineItems: { select: { id: true, quoteId: true, serviceId: true, description: true, quantity: true, unitPrice: true, lineTotal: true, discountPercent: true, sortOrder: true }, orderBy: { id: "asc" } },
          notes: { select: { id: true, quoteId: true, content: true, createdAt: true, updatedAt: true }, orderBy: { id: "asc" } },
          messages: { select: { id: true, quoteId: true, role: true, content: true, createdAt: true }, orderBy: { id: "asc" } },
          statusHistory: { select: { id: true, quoteId: true, status: true, note: true, changedAt: true }, orderBy: { id: "asc" } },
        },
        orderBy: { id: "asc" },
      }),
      prisma.project.findMany({
        select: {
          id: true, userId: true, name: true, client: true, type: true, description: true, owner: true,
          dueDate: true, progress: true, status: true, createdAt: true, updatedAt: true, kind: true,
          relationshipStatus: true, clientId: true, quoteId: true, agreedTotal: true, currency: true, paymentDueDate: true,
        },
        orderBy: { id: "asc" },
      }),
      prisma.projectPeriod.findMany({
        select: { id: true, projectId: true, label: true, startDate: true, dueDate: true, status: true, agreedTotal: true, currency: true, paymentDueDate: true, createdAt: true, updatedAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.workItem.findMany({
        select: { id: true, projectId: true, periodId: true, title: true, kind: true, priority: true, dueDate: true, recurring: true, completedAt: true, createdAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.workAssignment.findMany({
        select: { id: true, projectId: true, periodId: true, userId: true, createdAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.event.findMany({
        select: { id: true, userId: true, title: true, type: true, startAt: true, endAt: true, location: true, notes: true, clientId: true, periodId: true, projectId: true, createdAt: true, updatedAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.payment.findMany({
        select: { id: true, requestId: true, projectId: true, periodId: true, amount: true, currency: true, paidAt: true, note: true, recordedById: true, createdAt: true },
        orderBy: { id: "asc" },
      }),
      prisma.activityRecord.findMany({
        select: { id: true, actorId: true, projectId: true, periodId: true, clientId: true, action: true, description: true, createdAt: true },
        orderBy: { id: "asc" },
      }),
    ]);

  const pricingRules = services.flatMap((service) => service.pricingRules);
  const discountRules = services.flatMap((service) => service.discountRules);
  const lineItems = quotes.flatMap((quote) => quote.lineItems);
  const notes = quotes.flatMap((quote) => quote.notes);
  const messages = quotes.flatMap((quote) => quote.messages);
  const statusHistory = quotes.flatMap((quote) => quote.statusHistory);

  return {
    format: "diseno-creativo-business-snapshot",
    version: BUSINESS_SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    counts: {
      users: users.length, clients: clients.length, services: services.length, pricingRules: pricingRules.length,
      discountRules: discountRules.length, quotes: quotes.length, lineItems: lineItems.length, notes: notes.length,
      messages: messages.length, statusHistory: statusHistory.length, projects: projects.length, periods: periods.length,
      workItems: workItems.length, assignments: assignments.length, events: events.length, payments: payments.length,
      activity: activity.length,
    },
    data: { users, clients, services, quotes, projects, periods, workItems, assignments, events, payments, activity },
  };
}

export async function validateBusinessSnapshot(
  prisma: PrismaClient,
  snapshot: Awaited<ReturnType<typeof collectBusinessSnapshot>>,
) {
  const [users, clients, services, pricingRules, discountRules, quotes, lineItems, notes, messages, statusHistory, projects, periods, workItems, assignments, events, payments, activity] =
    await Promise.all([
      prisma.user.count(), prisma.client.count(), prisma.service.count(), prisma.pricingRule.count(), prisma.discountRule.count(),
      prisma.quote.count(), prisma.quoteLineItem.count(), prisma.quoteNote.count(), prisma.conversationMessage.count(),
      prisma.quoteStatusHistory.count(), prisma.project.count(), prisma.projectPeriod.count(), prisma.workItem.count(),
      prisma.workAssignment.count(), prisma.event.count(), prisma.payment.count(), prisma.activityRecord.count(),
    ]);
  const databaseCounts = { users, clients, services, pricingRules, discountRules, quotes, lineItems, notes, messages, statusHistory, projects, periods, workItems, assignments, events, payments, activity };
  const mismatches = Object.entries(databaseCounts).filter(([key, value]) => snapshot.counts[key as keyof typeof snapshot.counts] !== value);
  if (mismatches.length > 0) {
    throw new Error(`Los conteos del snapshot no coinciden con la base: ${mismatches.map(([key]) => key).join(", ")}.`);
  }
  if (snapshot.counts.services !== snapshot.data.services.length || snapshot.counts.pricingRules !== snapshot.data.services.flatMap((service) => service.pricingRules).length || snapshot.counts.discountRules !== snapshot.data.services.flatMap((service) => service.discountRules).length) {
    throw new Error("El catálogo de servicios o sus reglas no está completo en el snapshot.");
  }
  return databaseCounts;
}

export async function writeBusinessSnapshot(
  snapshot: Awaited<ReturnType<typeof collectBusinessSnapshot>>,
  outputDirectory: string,
) {
  const timestamp = snapshot.exportedAt.replace(/[:.]/g, "-");
  const directory = join(outputDirectory, timestamp);
  const snapshotPath = join(directory, "business-snapshot.json");
  const checksumPath = join(directory, "SHA256SUMS");
  const json = `${JSON.stringify(snapshot, null, 2)}\n`;

  JSON.parse(json);
  if (json.length === 0) throw new Error("El snapshot no puede estar vacío.");
  if (/postgres(?:ql)?:\/\//i.test(json) || /(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password)\s*[":=]/i.test(json)) {
    throw new Error("El snapshot contiene un patrón de secreto no permitido.");
  }

  await mkdir(directory, { recursive: true, mode: 0o700 });
  await chmod(directory, 0o700);
  await writeFile(snapshotPath, json, { encoding: "utf8", mode: 0o600 });
  await chmod(snapshotPath, 0o600);

  const checksum = createHash("sha256").update(json).digest("hex");
  await writeFile(checksumPath, `${checksum}  business-snapshot.json\n`, { encoding: "utf8", mode: 0o600 });
  await chmod(checksumPath, 0o600);

  return { directory, snapshotPath, checksumPath, bytes: Buffer.byteLength(json), checksum };
}
