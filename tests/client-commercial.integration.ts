import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  convertProspectToClient,
  createCommercialClient,
  findClientDuplicates,
  setCommercialClientFollowUp,
} from "../src/lib/client-commercial-service";
import { archiveClientRecord } from "../src/lib/work-service";
import { backfillCommercialClients } from "../src/lib/client-commercial-backfill";

async function main() {
  const pg = new PGlite();
  const migrations = (await readdir("prisma/migrations")).filter((name) => /^\d/.test(name)).sort();
  for (const migration of migrations) await pg.exec(await readFile(`prisma/migrations/${migration}/migration.sql`, "utf8"));
  const server = new PGLiteSocketServer({ db: pg, host: "127.0.0.1", port: 0 });
  await server.start();
  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: `postgresql://postgres@${server.getServerConn()}/postgres`, max: 1 }) });
  const admin = { userId: "admin", workspaceId: "workspace", role: "ADMIN" as const };
  const member = { userId: "member", workspaceId: "workspace", role: "MEMBER" as const };
  try {
    await db.user.createMany({ data: [
      { id: "admin", email: "admin@example.test", displayName: "Admin" },
      { id: "member", email: "member@example.test", displayName: "Member" },
      { id: "foreign", email: "foreign@example.test", displayName: "Foreign" },
    ] });
    await db.workspace.createMany({ data: [{ id: "workspace", name: "Diseño Creativo" }, { id: "foreign-workspace", name: "Foreign" }] });
    await db.workspaceMember.createMany({ data: [
      { id: "admin-member", workspaceId: "workspace", userId: "admin", role: "ADMIN" },
      { id: "member-member", workspaceId: "workspace", userId: "member", role: "MEMBER" },
      { id: "foreign-member", workspaceId: "foreign-workspace", userId: "foreign", role: "ADMIN" },
    ] });

    await db.client.create({ data: { id: "historic", workspaceId: "workspace", name: "Histórico", email: "HISTORICO@example.test" } });
    const historicDryRun = await backfillCommercialClients(db, { workspaceName: "Diseño Creativo", dryRun: true });
    assert.equal(historicDryRun.plannedUpdates, 1);
    const historicBackfill = await backfillCommercialClients(db, { workspaceName: "Diseño Creativo", dryRun: false });
    assert.equal(historicBackfill.updated, 1);
    const historic = await db.client.findUniqueOrThrow({ where: { id: "historic" } });
    assert.equal(historic.stage, "CLIENT");
    assert.equal(historic.prospectStatus, "WON");
    assert.equal(historic.responsibleId, "admin");
    assert.equal(historic.emailNormalized, "historico@example.test");
    console.log("✓ el backfill conserva clientes históricos como CLIENT y asigna el ADMIN responsable");

    const automatic = await createCommercialClient(db, { userId: "foreign", workspaceId: "foreign-workspace", role: "ADMIN" }, { stage: "CLIENT", name: "Contacto automático" });
    assert.equal(automatic.responsibleId, "foreign");
    console.log("✓ un workspace con una sola persona la selecciona como responsable automáticamente");

    await assert.rejects(createCommercialClient(db, admin, { stage: "PROSPECT", name: "Sin contacto", responsibleId: "member" }), /necesita email/);
    console.log("✓ prospectos exigen nombre, contacto y responsable válido");

    const prospect = await createCommercialClient(db, admin, {
      stage: "PROSPECT", name: "Ana Estudio", instagram: "@AnaEstudio", phone: "+34 600 111 222", source: "INSTAGRAM", responsibleId: "member",
      followUp: { date: new Date("2026-09-15T12:00:00Z"), time: "10:30", title: "Responder a Ana" },
    });
    const created = await db.client.findUniqueOrThrow({ where: { id: prospect.id }, include: { nextFollowUpEvent: true } });
    assert.equal(created.workspaceId, "workspace");
    assert.equal(created.stage, "PROSPECT");
    assert.equal(created.prospectStatus, "NEW");
    assert.equal(created.responsibleId, "member");
    assert.equal(created.nextFollowUpEvent?.type, "FOLLOW_UP");
    const originalEventId = created.nextFollowUpEvent?.id;
    console.log("✓ el seguimiento crea un único Event real vinculado al prospecto y Agenda");

    const duplicates = await findClientDuplicates(db, "workspace", { instagram: "@anaestudio", phone: "600111222" });
    assert.deepEqual(duplicates.map((candidate) => candidate.id), [prospect.id]);
    assert.deepEqual(await findClientDuplicates(db, "foreign-workspace", { instagram: "anaestudio" }), []);
    console.log("✓ los duplicados se normalizan y permanecen aislados por workspace");

    await setCommercialClientFollowUp(db, member, prospect.id, { date: new Date("2026-09-16T12:00:00Z"), time: "11:00", title: "Nuevo seguimiento" });
    const rescheduled = await db.client.findUniqueOrThrow({ where: { id: prospect.id }, include: { nextFollowUpEvent: true } });
    assert.equal(rescheduled.nextFollowUpEvent?.id, originalEventId);
    assert.equal(rescheduled.nextFollowUpEvent?.title, "Nuevo seguimiento");
    console.log("✓ modificar la próxima acción actualiza el mismo evento de Agenda");

    await db.quote.create({ data: { id: "quote", userId: "admin", workspaceId: "workspace", clientId: prospect.id } });
    const converted = await convertProspectToClient(db, member, prospect.id);
    assert.equal(converted.id, prospect.id);
    assert.equal(converted.stage, "CLIENT");
    assert.equal(converted.prospectStatus, "WON");
    assert.ok(converted.convertedAt);
    assert.equal(await db.quote.count({ where: { clientId: prospect.id } }), 1);
    assert.equal(await db.event.count({ where: { clientId: prospect.id, type: "FOLLOW_UP" } }), 1);
    assert.equal(await db.activityRecord.count({ where: { clientId: prospect.id, action: "PROSPECT_CONVERTED" } }), 1);
    console.log("✓ convertir conserva ID, presupuesto, actividad y seguimiento sin duplicar contacto");

    await assert.rejects(setCommercialClientFollowUp(db, { userId: "foreign", workspaceId: "foreign-workspace", role: "ADMIN" }, prospect.id, null), /no disponible/);
    await assert.rejects(createCommercialClient(db, admin, { stage: "CLIENT", name: "Responsable externo", responsibleId: "foreign" }), /no pertenece/);
    await assert.rejects(archiveClientRecord(db, member, prospect.id, true), /administrador/);
    await archiveClientRecord(db, admin, prospect.id, true);
    assert.ok((await db.client.findUniqueOrThrow({ where: { id: prospect.id } })).archivedAt);
    console.log("✓ accesos por ID ajeno y archivado de MEMBER son rechazados; ADMIN puede archivar");
  } finally {
    await db.$disconnect();
    await server.stop();
    await pg.close();
  }
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
