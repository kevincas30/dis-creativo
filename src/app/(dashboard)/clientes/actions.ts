"use server";

import { getCurrentUser } from "@/lib/current-user";
import { archiveClientRecord } from "@/lib/work-service";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { serializeClient } from "@/lib/client-presenter";
import { CLIENT_STATUS_ORDER } from "@/lib/client-status";
import type { ClientStatus } from "@/generated/prisma/enums";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readText(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readStatus(formData: FormData): ClientStatus {
  const raw = formData.get("status");
  if (typeof raw === "string" && (CLIENT_STATUS_ORDER as string[]).includes(raw)) return raw as ClientStatus;
  return "ACTIVE";
}

function buildClientData(formData: FormData) {
  const firstName = readText(formData, "firstName");
  const lastName = readText(formData, "lastName");
  const email = readText(formData, "email");

  if (!firstName || !lastName) {
    throw new Error("Nombre y apellidos son obligatorios.");
  }
  if (!email || !EMAIL_PATTERN.test(email)) {
    throw new Error("El email es obligatorio y debe tener un formato válido.");
  }

  const name = `${firstName} ${lastName}`.trim();

  return {
    name,
    firstName,
    lastName,
    email,
    company: readText(formData, "company"),
    phone: readText(formData, "phone"),
    country: readText(formData, "country"),
    address: readText(formData, "address"),
    website: readText(formData, "website"),
    notes: readText(formData, "notes"),
    status: readStatus(formData),
  };
}

export async function createClient(formData: FormData) {
  await getCurrentUser();
  const data = buildClientData(formData);

  const client = await prisma.client.create({ data });

  revalidatePath("/clientes");
  redirect(`/clientes/${client.id}`);
}

export async function updateClient(clientId: string, formData: FormData) {
  await getCurrentUser();
  const data = buildClientData(formData);

  const client = await prisma.client.update({ where: { id: clientId }, data });

  revalidatePath("/clientes");
  revalidatePath(`/clientes/${clientId}`);

  return serializeClient(client);
}

export async function setClientArchived(clientId: string, archived: boolean) {
  try {
    const user = await getCurrentUser();
    await archiveClientRecord(prisma, user.id, clientId, archived);
    revalidatePath("/", "layout");
    return { error: null };
  } catch (error) { return { error: error instanceof Error && !("code" in error) ? error.message : "No se pudo guardar el archivo del cliente." }; }
}
