import type { WorkspaceRole } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

const WORKSPACE_ROLES = new Set<WorkspaceRole>(["ADMIN", "MEMBER"]);

export type WorkspaceBootstrapMember = {
  identity: string;
  role: WorkspaceRole;
};

export type WorkspaceBootstrapInput = {
  workspaceName: string;
  members: WorkspaceBootstrapMember[];
  dryRun: boolean;
};

type BootstrapTransaction = Pick<Prisma.TransactionClient, "user" | "workspace" | "workspaceMember">;
type BootstrapUser = { id: string; email: string };

export type WorkspaceBootstrapDatabase = {
  $transaction: <T>(callback: (transaction: BootstrapTransaction) => Promise<T>) => Promise<T>;
};

export type WorkspaceBootstrapResult = {
  dryRun: boolean;
  workspace: { id: string | null; name: string; exists: boolean };
  members: {
    identity: string;
    userId: string;
    email: string;
    role: WorkspaceRole;
    action: "create" | "update" | "unchanged";
  }[];
};

function normalizeIdentity(value: string): string {
  return value.trim().toLowerCase();
}

export function parseWorkspaceBootstrapArgs(argv: string[]): WorkspaceBootstrapInput {
  let workspaceName: string | null = null;
  const members: WorkspaceBootstrapMember[] = [];
  let dryRun = false;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }

    if (argument === "--workspace-name") {
      workspaceName = argv[index + 1]?.trim() || null;
      index += 1;
      continue;
    }

    if (argument === "--member") {
      const rawMember = argv[index + 1]?.trim();
      index += 1;
      if (!rawMember) throw new Error("Cada --member necesita un email o ID de usuario.");

      const match = rawMember.match(/^(.*):(ADMIN|MEMBER)$/);
      const identity = (match?.[1] ?? rawMember).trim();
      const role = (match?.[2] ?? "MEMBER") as WorkspaceRole;
      if (!identity) throw new Error("Cada --member necesita un email o ID de usuario.");
      members.push({ identity, role });
      continue;
    }

    throw new Error(`Argumento no reconocido: ${argument}`);
  }

  if (!workspaceName) throw new Error("Usa --workspace-name con un nombre no vacío.");
  if (members.length === 0) throw new Error("Indica al menos un --member.");

  const identities = new Set<string>();
  for (const member of members) {
    if (!WORKSPACE_ROLES.has(member.role)) throw new Error(`Rol de workspace inválido: ${member.role}`);
    const normalized = normalizeIdentity(member.identity);
    if (identities.has(normalized)) throw new Error(`Usuario repetido en --member: ${member.identity}`);
    identities.add(normalized);
  }

  return { workspaceName, members, dryRun };
}

function resolveRequestedUsers(users: BootstrapUser[], members: WorkspaceBootstrapMember[]) {
  const resolved = members.map((member) => {
    const identity = normalizeIdentity(member.identity);
    const matchingUsers = users.filter(
      (user) => user.id.toLowerCase() === identity || user.email.toLowerCase() === identity,
    );

    if (matchingUsers.length !== 1) {
      throw new Error(`No se encontró un usuario público único para: ${member.identity}`);
    }

    return { member, user: matchingUsers[0] };
  });

  const userIds = new Set(resolved.map(({ user }) => user.id));
  if (userIds.size !== resolved.length) {
    throw new Error("Los miembros indicados resuelven al mismo usuario público.");
  }

  return resolved;
}

export async function bootstrapWorkspace(
  database: WorkspaceBootstrapDatabase,
  input: WorkspaceBootstrapInput,
): Promise<WorkspaceBootstrapResult> {
  return database.$transaction(async (transaction) => {
    const identities = input.members.map(({ identity }) => identity);
    const users = await transaction.user.findMany({
      where: { OR: [{ id: { in: identities } }, { email: { in: identities } }] },
      select: { id: true, email: true },
    });
    const requestedUsers = resolveRequestedUsers(users, input.members);
    const existingWorkspace = await transaction.workspace.findUnique({
      where: { name: input.workspaceName },
      select: { id: true, name: true },
    });

    if (!existingWorkspace && !input.members.some((member) => member.role === "ADMIN")) {
      throw new Error("Un workspace nuevo necesita al menos un miembro ADMIN.");
    }

    const existingMemberships = existingWorkspace
      ? await transaction.workspaceMember.findMany({
        where: { workspaceId: existingWorkspace.id },
        select: { userId: true, role: true },
      })
      : [];
    const finalRoles = new Map(existingMemberships.map((member) => [member.userId, member.role]));
    for (const { member, user } of requestedUsers) finalRoles.set(user.id, member.role);
    if (![...finalRoles.values()].includes("ADMIN")) {
      throw new Error("El workspace debe conservar al menos un miembro ADMIN.");
    }

    const existingByUserId = new Map(existingMemberships.map((member) => [member.userId, member]));
    const resultMembers = requestedUsers.map(({ member, user }) => {
      const existing = existingByUserId.get(user.id);
      return {
        identity: member.identity,
        userId: user.id,
        email: user.email,
        role: member.role,
        action: !existing ? "create" as const : existing.role === member.role ? "unchanged" as const : "update" as const,
      };
    });

    if (input.dryRun) {
      return {
        dryRun: true,
        workspace: { id: existingWorkspace?.id ?? null, name: input.workspaceName, exists: Boolean(existingWorkspace) },
        members: resultMembers,
      };
    }

    const workspace = existingWorkspace ?? await transaction.workspace.create({
      data: { name: input.workspaceName },
      select: { id: true, name: true },
    });

    for (const member of resultMembers) {
      if (member.action === "create") {
        await transaction.workspaceMember.create({
          data: { workspaceId: workspace.id, userId: member.userId, role: member.role },
        });
      } else if (member.action === "update") {
        await transaction.workspaceMember.update({
          where: { workspaceId_userId: { workspaceId: workspace.id, userId: member.userId } },
          data: { role: member.role },
        });
      }
    }

    return {
      dryRun: false,
      workspace: { id: workspace.id, name: workspace.name, exists: Boolean(existingWorkspace) },
      members: resultMembers,
    };
  });
}
