import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Prisma } from "../src/generated/prisma/client";
import { collectBusinessSnapshot } from "../src/lib/business-snapshot";
import {
  WORKSPACE_BACKFILL_TRANSACTION_OPTIONS,
  WorkspaceBackfillConflictError,
  backfillWorkspace,
  type WorkspaceBackfillDatabase,
  type WorkspaceBackfillTransactionOptions,
  validateWorkspaceBackfill,
} from "../src/lib/workspace-backfill";

async function main() {
  const pg = new PGlite();
  const migrations = (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort();
  for (const migration of migrations) await pg.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  const server = new PGLiteSocketServer({ db: pg, host: "127.0.0.1", port: 0 });
  await server.start();
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: `postgresql://postgres@${server.getServerConn()}/postgres`, max: 1 }) });
  const transactionOptions: Array<WorkspaceBackfillTransactionOptions | undefined> = [];
  const trackedDatabase: WorkspaceBackfillDatabase = {
    $transaction<T>(callback: (transaction: Prisma.TransactionClient) => Promise<T>, options?: WorkspaceBackfillTransactionOptions) {
      transactionOptions.push(options);
      return db.$transaction(callback, options);
    },
  };
  const input = { workspaceName: "Diseño Creativo", dryRun: false };
  try {
    await db.user.createMany({ data: [
      { id: "owner", email: "owner@example.test", displayName: "Owner" },
      { id: "gmail-test", email: "gmail@example.test", displayName: "Test Gmail" },
    ] });
    await db.workspace.create({ data: { id: "workspace", name: "Diseño Creativo" } });
    await db.workspaceMember.create({ data: { id: "owner-member", workspaceId: "workspace", userId: "owner", role: "ADMIN" } });
    await db.client.create({ data: { id: "client", name: "Client" } });
    await db.service.create({
      data: {
        id: "service", code: "SERVICE", name: "Service", category: "Design",
        pricingRules: { create: { id: "price", currency: "EUR", basePrice: "100" } },
        discountRules: { create: { id: "discount", minQty: 2, percent: "10" } },
      },
    });
    await db.quote.create({
      data: {
        id: "quote", userId: "owner", clientId: "client", status: "ACCEPTED",
        lineItems: { create: { id: "line", serviceId: "service", description: "Service", quantity: "1", unitPrice: "100", lineTotal: "100" } },
        notes: { create: { id: "note", content: "Internal" } },
        messages: { create: { id: "message", role: "user", content: "Hello" } },
        statusHistory: { create: { id: "history", status: "ACCEPTED" } },
      },
    });
    await db.project.create({ data: { id: "project", userId: "owner", name: "Project", client: "Client", clientId: "client", quoteId: "quote", kind: "RECURRING" } });
    await db.projectPeriod.create({ data: { id: "period", projectId: "project", label: "September", startDate: new Date("2026-09-01") } });
    await db.workItem.create({ data: { id: "work", projectId: "project", periodId: "period", title: "Task" } });
    await db.workAssignment.create({ data: { id: "assignment", projectId: "project", periodId: "period", userId: "owner" } });
    await db.event.create({ data: { id: "event", userId: "owner", title: "Review", startAt: new Date("2026-09-02T10:00:00Z"), endAt: new Date("2026-09-02T11:00:00Z"), clientId: "client", projectId: "project", periodId: "period" } });
    await db.payment.create({ data: { id: "payment", requestId: "request", projectId: "project", periodId: "period", amount: "100", currency: "EUR", paidAt: new Date("2026-09-02"), recordedById: "owner" } });
    await db.activityRecord.create({ data: { id: "activity", actorId: "owner", clientId: "client", projectId: "project", periodId: "period", action: "TEST", description: "Created" } });
    const snapshot = await collectBusinessSnapshot(db);

    const dryRun = await backfillWorkspace(trackedDatabase, { ...input, dryRun: true });
    assert.equal(dryRun.before.services.unassigned, 1);
    assert.equal(dryRun.updates, null);
    assert.equal(await db.service.count({ where: { workspaceId: null } }), 1);
    assert.deepEqual(transactionOptions.at(-1), WORKSPACE_BACKFILL_TRANSACTION_OPTIONS);
    console.log("✓ dry-run reports root rows without writing and uses the configured transaction timeout");

    const rollbackDatabase: WorkspaceBackfillDatabase = {
      $transaction<T>(callback: (transaction: Prisma.TransactionClient) => Promise<T>, options?: WorkspaceBackfillTransactionOptions) {
        return db.$transaction(async (transaction) => {
          const failingService = new Proxy(transaction.service, {
            get(target, property, receiver) {
              if (property === "updateMany") return async () => { throw new Error("forced service update failure"); };
              return Reflect.get(target, property, receiver);
            },
          });
          const failingTransaction = new Proxy(transaction, {
            get(target, property, receiver) {
              if (property === "service") return failingService;
              return Reflect.get(target, property, receiver);
            },
          }) as Prisma.TransactionClient;
          return callback(failingTransaction);
        }, options);
      },
    };
    await assert.rejects(backfillWorkspace(rollbackDatabase, input), /forced service update failure/);
    assert.equal(await db.client.count({ where: { workspaceId: null } }), 1);
    assert.equal(await db.service.count({ where: { workspaceId: null } }), 1);
    assert.equal(await db.pricingRule.count(), 1);
    assert.equal(await db.discountRule.count(), 1);
    console.log("✓ a write failure rolls back every prior root update and preserves catalog rules");

    const first = await backfillWorkspace(trackedDatabase, input);
    assert.deepEqual(first.updates, { clients: 1, services: 1, quotes: 1, projects: 1, workItems: 1, events: 1, activity: 1 });
    assert.equal(await db.service.count({ where: { workspaceId: "workspace" } }), 1);
    assert.equal(await db.pricingRule.count(), 1);
    assert.equal(await db.discountRule.count(), 1);
    console.log("✓ normal run scopes every root and preserves catalog rules");

    const second = await backfillWorkspace(trackedDatabase, input);
    assert.deepEqual(second.updates, { clients: 0, services: 0, quotes: 0, projects: 0, workItems: 0, events: 0, activity: 0 });
    console.log("✓ second run is idempotent");

    const validation = await validateWorkspaceBackfill(trackedDatabase, { ...input, snapshot, adminEmail: "owner@example.test", excludedEmail: "gmail@example.test" });
    assert.equal(validation.ok, true);
    assert.equal(validation.catalog.services, 1);
    assert.equal(validation.catalog.pricingRules, 1);
    assert.equal(validation.catalog.discountRules, 1);
    assert.equal(validation.acceptedProjectLinks, 1);
    console.log("✓ validation confirms IDs, relations, admin and catalog against snapshot");

    await db.workspace.create({ data: { id: "foreign-workspace", name: "Foreign" } });
    await db.client.create({ data: { id: "foreign-client", workspaceId: "foreign-workspace", name: "Foreign" } });
    await db.quote.create({ data: { id: "conflict-quote", userId: "owner", clientId: "foreign-client" } });
    await assert.rejects(backfillWorkspace(trackedDatabase, input), WorkspaceBackfillConflictError);
    assert.equal((await db.quote.findUniqueOrThrow({ where: { id: "conflict-quote" } })).workspaceId, null);
    console.log("✓ conflicts cancel the transaction without assigning rows");
  } finally {
    await db.$disconnect();
    await server.stop();
    await pg.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
