import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/current-user";
import type { User, Workspace, WorkspaceMember } from "@/generated/prisma/client";
import type { WorkspaceRole } from "@/generated/prisma/enums";

export type ActiveWorkspaceMembership = WorkspaceMember & { workspace: Workspace };

export type CurrentWorkspaceContext = {
  user: User;
  membership: ActiveWorkspaceMembership;
  workspace: Workspace;
};

export type WorkspaceActor = {
  userId: string;
  workspaceId: string;
  role: WorkspaceRole;
};

export function workspaceActor(context: CurrentWorkspaceContext): WorkspaceActor {
  return { userId: context.user.id, workspaceId: context.workspace.id, role: context.membership.role };
}

export class WorkspaceAccessError extends Error {
  constructor(
    public readonly code: "NO_WORKSPACE_MEMBERSHIP" | "AMBIGUOUS_WORKSPACE" | "ADMIN_REQUIRED",
    message: string,
  ) {
    super(message);
    this.name = "WorkspaceAccessError";
  }
}

type MembershipFinder = (userId: string) => Promise<ActiveWorkspaceMembership[]>;

async function findMemberships(userId: string): Promise<ActiveWorkspaceMembership[]> {
  return prisma.workspaceMember.findMany({
    where: { userId },
    include: { workspace: true },
    orderBy: { workspace: { createdAt: "asc" } },
  });
}

/**
 * Fase 0A admite un único workspace activo por usuario. Cuando exista un
 * selector de workspace, este resolver recibirá el workspace seleccionado en
 * vez de elegir una membresía de forma implícita.
 */
export async function resolveActiveWorkspaceMembership(
  userId: string,
  lookup: MembershipFinder = findMemberships,
): Promise<ActiveWorkspaceMembership | null> {
  const memberships = await lookup(userId);

  if (memberships.length === 0) return null;
  if (memberships.length > 1) {
    throw new WorkspaceAccessError(
      "AMBIGUOUS_WORKSPACE",
      "Tu cuenta pertenece a más de un workspace. Selecciona uno antes de continuar.",
    );
  }

  return memberships[0];
}

export async function getCurrentWorkspaceContext(
  dependencies: {
    getUser?: () => Promise<User>;
    lookupMemberships?: MembershipFinder;
  } = {},
): Promise<CurrentWorkspaceContext> {
  const user = await (dependencies.getUser ?? getAuthenticatedUser)();
  const membership = await resolveActiveWorkspaceMembership(user.id, dependencies.lookupMemberships);

  if (!membership) {
    throw new WorkspaceAccessError(
      "NO_WORKSPACE_MEMBERSHIP",
      "Tu cuenta todavía no pertenece a un workspace.",
    );
  }

  return { user, membership, workspace: membership.workspace };
}

export async function getCurrentWorkspace(
  dependencies?: Parameters<typeof getCurrentWorkspaceContext>[0],
): Promise<Workspace> {
  return (await getCurrentWorkspaceContext(dependencies)).workspace;
}

export async function requireWorkspaceMembership(
  dependencies?: Parameters<typeof getCurrentWorkspaceContext>[0],
): Promise<CurrentWorkspaceContext> {
  return getCurrentWorkspaceContext(dependencies);
}

export function requireWorkspaceRole(
  context: CurrentWorkspaceContext,
  role: WorkspaceRole,
): CurrentWorkspaceContext {
  if (context.membership.role !== role) {
    throw new WorkspaceAccessError("ADMIN_REQUIRED", "Esta acción requiere permisos de administrador.");
  }

  return context;
}

export async function requireWorkspaceAdmin(
  dependencies?: Parameters<typeof getCurrentWorkspaceContext>[0],
): Promise<CurrentWorkspaceContext> {
  return requireWorkspaceRole(await requireWorkspaceMembership(dependencies), "ADMIN");
}
