import assert from "node:assert/strict";
import test from "node:test";
import type { User } from "@/generated/prisma/client";
import type { ActiveWorkspaceMembership, CurrentWorkspaceContext } from "./workspace-access";
import {
  WorkspaceAccessError,
  getCurrentWorkspace,
  requireWorkspaceAdmin,
  resolveActiveWorkspaceMembership,
} from "./workspace-access";

const user = { id: "user-1", email: "member@example.com", displayName: "Member" } as User;
const membership = {
  id: "membership-1",
  userId: user.id,
  workspaceId: "workspace-1",
  role: "MEMBER",
  createdAt: new Date(),
  updatedAt: new Date(),
  workspace: { id: "workspace-1", name: "Diseño Creativo", createdAt: new Date(), updatedAt: new Date() },
} as ActiveWorkspaceMembership;

test("resuelve la única membresía activa", async () => {
  const actual = await resolveActiveWorkspaceMembership(user.id, async () => [membership]);
  assert.equal(actual?.workspace.id, "workspace-1");
});

test("devuelve null cuando la cuenta no tiene membresía", async () => {
  assert.equal(await resolveActiveWorkspaceMembership(user.id, async () => []), null);
});

test("rechaza una selección implícita entre varios workspaces", async () => {
  await assert.rejects(
    resolveActiveWorkspaceMembership(user.id, async () => [membership, { ...membership, id: "membership-2", workspaceId: "workspace-2", workspace: { ...membership.workspace, id: "workspace-2" } }]),
    (error: unknown) => error instanceof WorkspaceAccessError && error.code === "AMBIGUOUS_WORKSPACE",
  );
});

test("obtiene el workspace actual y exige administrador", async () => {
  const dependencies = { getUser: async () => user, lookupMemberships: async () => [membership] };
  assert.equal((await getCurrentWorkspace(dependencies)).id, "workspace-1");
  await assert.rejects(
    requireWorkspaceAdmin(dependencies),
    (error: unknown) => error instanceof WorkspaceAccessError && error.code === "ADMIN_REQUIRED",
  );

  const adminMembership = { ...membership, role: "ADMIN" as const };
  const adminContext = await requireWorkspaceAdmin({ ...dependencies, lookupMemberships: async () => [adminMembership] });
  assert.equal(adminContext.membership.role, "ADMIN");
});

test("el contexto conserva usuario, membresía y workspace", async () => {
  const context: CurrentWorkspaceContext = {
    user,
    membership,
    workspace: membership.workspace,
  };
  assert.equal(context.workspace.id, context.membership.workspaceId);
});
