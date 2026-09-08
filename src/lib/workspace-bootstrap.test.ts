import assert from "node:assert/strict";
import test from "node:test";
import {
  bootstrapWorkspace,
  parseWorkspaceBootstrapArgs,
  type WorkspaceBootstrapDatabase,
} from "./workspace-bootstrap";

function createDatabase(options: {
  workspace?: { id: string; name: string };
  memberships?: Array<{ userId: string; role: "ADMIN" | "MEMBER" }>;
} = {}) {
  const writes: string[] = [];
  const users = [
    { id: "user-admin", email: "admin@example.com" },
    { id: "user-member", email: "member@example.com" },
  ];
  const memberships = [...(options.memberships ?? [])];
  const database = {
    async $transaction(callback: Parameters<WorkspaceBootstrapDatabase["$transaction"]>[0]) {
      const transaction = {
        user: { async findMany() { return users; } },
        workspace: {
          async findUnique() { return options.workspace ?? null; },
          async create() { writes.push("workspace:create"); return { id: "workspace-1", name: "Diseño Creativo" }; },
        },
        workspaceMember: {
          async findMany() { return memberships; },
          async create() { writes.push("membership:create"); return {}; },
          async update() { writes.push("membership:update"); return {}; },
        },
      } as unknown as Parameters<WorkspaceBootstrapDatabase["$transaction"]>[0] extends (transaction: infer Transaction) => Promise<unknown> ? Transaction : never;
      return callback(transaction);
    },
  } as unknown as WorkspaceBootstrapDatabase;
  return { database, writes };
}

test("analiza nombre, miembros y dry-run sin valores hardcodeados", () => {
  assert.deepEqual(
    parseWorkspaceBootstrapArgs(["--workspace-name", "Diseño Creativo", "--member", "admin@example.com:ADMIN", "--member", "user-member", "--dry-run"]),
    {
      workspaceName: "Diseño Creativo",
      members: [{ identity: "admin@example.com", role: "ADMIN" }, { identity: "user-member", role: "MEMBER" }],
      dryRun: true,
    },
  );
});

test("dry-run valida usuarios y no escribe", async () => {
  const { database, writes } = createDatabase();
  const result = await bootstrapWorkspace(database, parseWorkspaceBootstrapArgs([
    "--workspace-name", "Diseño Creativo", "--member", "admin@example.com:ADMIN", "--member", "member@example.com", "--dry-run",
  ]));
  assert.equal(result.dryRun, true);
  assert.equal(result.workspace.id, null);
  assert.deepEqual(result.members.map((member) => member.action), ["create", "create"]);
  assert.deepEqual(writes, []);
});

test("crea un workspace nuevo y membresías dentro de la transacción", async () => {
  const { database, writes } = createDatabase();
  const result = await bootstrapWorkspace(database, parseWorkspaceBootstrapArgs([
    "--workspace-name", "Diseño Creativo", "--member", "admin@example.com:ADMIN", "--member", "member@example.com:MEMBER",
  ]));
  assert.equal(result.workspace.id, "workspace-1");
  assert.deepEqual(writes, ["workspace:create", "membership:create", "membership:create"]);
});

test("es idempotente y actualiza solo roles solicitados", async () => {
  const { database, writes } = createDatabase({
    workspace: { id: "workspace-1", name: "Diseño Creativo" },
    memberships: [{ userId: "user-admin", role: "MEMBER" }, { userId: "user-member", role: "MEMBER" }],
  });
  const result = await bootstrapWorkspace(database, parseWorkspaceBootstrapArgs([
    "--workspace-name", "Diseño Creativo", "--member", "admin@example.com:ADMIN", "--member", "member@example.com:MEMBER",
  ]));
  assert.deepEqual(result.members.map((member) => member.action), ["update", "unchanged"]);
  assert.deepEqual(writes, ["membership:update"]);
});

test("rechaza workspaces nuevos sin administrador y usuarios inexistentes", async () => {
  const { database } = createDatabase();
  await assert.rejects(
    bootstrapWorkspace(database, parseWorkspaceBootstrapArgs(["--workspace-name", "Diseño Creativo", "--member", "member@example.com"])),
    /ADMIN/,
  );
  await assert.rejects(
    bootstrapWorkspace(database, parseWorkspaceBootstrapArgs(["--workspace-name", "Diseño Creativo", "--member", "missing@example.com:ADMIN"])),
    /No se encontró/,
  );
});
