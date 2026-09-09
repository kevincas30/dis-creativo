"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { archiveClientRecord } from "@/lib/work-service";
import {
  convertProspectToClient,
  createCommercialClient,
  findClientDuplicates,
  setCommercialClientFollowUp,
  updateCommercialClient,
} from "@/lib/client-commercial-service";
import { requireWorkspaceAdmin, requireWorkspaceMembership, workspaceActor } from "@/lib/workspace-access";
import { serializeClient } from "@/lib/client-presenter";
import type { ClientStage, LeadSource, ProspectStatus } from "@/generated/prisma/enums";

const STAGES = new Set<ClientStage>(["PROSPECT", "CLIENT"]);
const PROSPECT_STATUSES = new Set<ProspectStatus>(["NEW", "CONTACTED", "QUOTE", "WON", "LOST"]);
const LEAD_SOURCES = new Set<LeadSource>(["INSTAGRAM", "WHATSAPP", "REFERRAL", "DIRECT", "OTHER"]);

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (trimmed.length > 4000) throw new Error("El texto es demasiado largo.");
  return trimmed || null;
}

function dateAndTime(formData: FormData) {
  const mode = text(formData, "followUpMode") ?? "NONE";
  if (mode === "NONE") return null;
  if (mode !== "SCHEDULE") throw new Error("Seguimiento no válido.");
  const date = text(formData, "followUpDate");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error("Selecciona la fecha del seguimiento.");
  const parsed = new Date(`${date}T12:00:00`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) throw new Error("La fecha del seguimiento no es válida.");
  return { date: parsed, time: text(formData, "followUpTime"), title: text(formData, "followUpTitle") };
}

function inputFromForm(formData: FormData) {
  const rawStage = text(formData, "stage") ?? "CLIENT";
  if (!STAGES.has(rawStage as ClientStage)) throw new Error("Etapa comercial no válida.");
  const rawStatus = text(formData, "prospectStatus");
  const rawSource = text(formData, "source");
  if (rawStatus && !PROSPECT_STATUSES.has(rawStatus as ProspectStatus)) throw new Error("Estado del prospecto no válido.");
  if (rawSource && !LEAD_SOURCES.has(rawSource as LeadSource)) throw new Error("Canal de origen no válido.");
  return {
    stage: rawStage as ClientStage,
    name: text(formData, "name") ?? "",
    company: text(formData, "company"), email: text(formData, "email"), phone: text(formData, "phone"), instagram: text(formData, "instagram"),
    country: text(formData, "country"), address: text(formData, "address"), website: text(formData, "website"), notes: text(formData, "notes"),
    source: rawSource as LeadSource | null, prospectStatus: rawStatus as ProspectStatus | undefined,
    responsibleId: text(formData, "responsibleId"), followUp: dateAndTime(formData),
  };
}

export async function findPotentialClientDuplicates(formData: FormData) {
  const { workspace } = await requireWorkspaceMembership();
  return findClientDuplicates(prisma, workspace.id, inputFromForm(formData));
}

export async function createClient(formData: FormData) {
  const context = await requireWorkspaceMembership();
  const client = await createCommercialClient(prisma, workspaceActor(context), inputFromForm(formData));
  revalidatePath("/", "layout");
  return { id: client.id, stage: client.stage, displayName: client.name };
}

export async function updateClient(clientId: string, formData: FormData) {
  const context = await requireWorkspaceMembership();
  const client = await updateCommercialClient(prisma, workspaceActor(context), clientId, inputFromForm(formData));
  revalidatePath("/", "layout");
  return serializeClient(client);
}

export async function saveClientFollowUp(clientId: string, formData: FormData) {
  const context = await requireWorkspaceMembership();
  await setCommercialClientFollowUp(prisma, workspaceActor(context), clientId, dateAndTime(formData));
  revalidatePath("/", "layout");
}

export async function clearClientFollowUp(clientId: string) {
  const context = await requireWorkspaceMembership();
  await setCommercialClientFollowUp(prisma, workspaceActor(context), clientId, null);
  revalidatePath("/", "layout");
}

export async function convertClientToCustomer(clientId: string) {
  const context = await requireWorkspaceMembership();
  await convertProspectToClient(prisma, workspaceActor(context), clientId);
  revalidatePath("/", "layout");
}

export async function setClientArchived(clientId: string, archived: boolean) {
  try {
    const context = await requireWorkspaceAdmin();
    await archiveClientRecord(prisma, workspaceActor(context), clientId, archived);
    revalidatePath("/", "layout");
    return { error: null };
  } catch (error) {
    return { error: error instanceof Error && !("code" in error) ? error.message : "No se pudo guardar el archivo del cliente." };
  }
}
