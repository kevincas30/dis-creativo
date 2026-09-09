import type { Prisma } from "@/generated/prisma/client";
import { normalizeEmail, normalizeInstagram, normalizePhone } from "@/lib/client-commercial-service";

export type CommercialBackfillInput = { workspaceId?: string; workspaceName?: string; dryRun: boolean };

function target(input: CommercialBackfillInput) {
  const workspaceId = input.workspaceId?.trim() || undefined;
  const workspaceName = input.workspaceName?.trim() || undefined;
  if (Boolean(workspaceId) === Boolean(workspaceName)) throw new Error("Indica exactamente uno de --workspace-id o --workspace-name.");
  return { workspaceId, workspaceName };
}

export function parseCommercialBackfillArgs(argv: string[]): CommercialBackfillInput {
  let workspaceId: string | undefined;
  let workspaceName: string | undefined;
  let dryRun = false;
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--dry-run") { dryRun = true; continue; }
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
  return { ...target({ workspaceId, workspaceName, dryRun }), dryRun };
}

export async function backfillCommercialClients(
  database: { $transaction: <T>(callback: (transaction: Prisma.TransactionClient) => Promise<T>) => Promise<T> },
  input: CommercialBackfillInput,
) {
  return database.$transaction(async (transaction) => {
    const requested = target(input);
    const workspace = requested.workspaceId
      ? await transaction.workspace.findUnique({ where: { id: requested.workspaceId }, select: { id: true, name: true } })
      : await transaction.workspace.findUnique({ where: { name: requested.workspaceName! }, select: { id: true, name: true } });
    if (!workspace) throw new Error("No existe el workspace indicado.");
    const admins = await transaction.workspaceMember.findMany({ where: { workspaceId: workspace.id, role: "ADMIN" }, select: { userId: true } });
    if (admins.length !== 1) throw new Error("El backfill necesita exactamente un ADMIN para conservar la responsabilidad histórica.");
    const clients = await transaction.client.findMany({ where: { workspaceId: workspace.id }, select: { id: true, stage: true, prospectStatus: true, responsibleId: true, email: true, phone: true, instagram: true, emailNormalized: true, phoneNormalized: true, instagramNormalized: true } });
    const updates = clients.filter((client) => client.stage === "CLIENT" && (
      client.responsibleId === null ||
      client.prospectStatus !== "WON" ||
      client.emailNormalized !== normalizeEmail(client.email) ||
      client.phoneNormalized !== normalizePhone(client.phone) ||
      client.instagramNormalized !== normalizeInstagram(client.instagram)
    ));
    if (input.dryRun) return { dryRun: true, workspace, clientCount: clients.length, plannedUpdates: updates.length, missingResponsible: clients.filter((client) => !client.responsibleId).length };
    for (const client of updates) {
      await transaction.client.update({ where: { id: client.id }, data: {
        responsibleId: client.responsibleId ?? admins[0].userId,
        prospectStatus: "WON",
        emailNormalized: normalizeEmail(client.email), phoneNormalized: normalizePhone(client.phone), instagramNormalized: normalizeInstagram(client.instagram),
      } });
    }
    const missingResponsible = await transaction.client.count({ where: { workspaceId: workspace.id, stage: "CLIENT", responsibleId: null } });
    if (missingResponsible) throw new Error("Quedan clientes históricos sin responsable.");
    return { dryRun: false, workspace, clientCount: clients.length, updated: updates.length, missingResponsible };
  });
}
