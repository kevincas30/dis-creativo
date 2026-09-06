"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";
import { serializeEvent } from "@/lib/event-presenter";
import { EVENT_TYPE_ORDER } from "@/lib/event-type";
import type { EventType } from "@/generated/prisma/enums";

function readText(formData: FormData, key: string): string | null {
  const raw = formData.get(key);
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readType(formData: FormData): EventType {
  const raw = formData.get("type");
  if (typeof raw === "string" && (EVENT_TYPE_ORDER as string[]).includes(raw)) return raw as EventType;
  return "MEETING";
}

const EVENT_SELECT = {
  id: true,
  title: true,
  type: true,
  startAt: true,
  endAt: true,
  location: true,
  notes: true,
  clientId: true,
  projectId: true,
  client: { select: { id: true, name: true } },
  project: { select: { id: true, name: true } },
} as const;

export async function createEvent(formData: FormData) {
  const user = await getCurrentUser();

  const title = readText(formData, "title");
  const date = readText(formData, "date");
  const startTime = readText(formData, "startTime");
  const endTime = readText(formData, "endTime");
  if (!title || !date || !startTime || !endTime) {
    throw new Error("Título, fecha, hora de inicio y hora de fin son obligatorios.");
  }

  const startAt = new Date(`${date}T${startTime}`);
  const endAt = new Date(`${date}T${endTime}`);
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    throw new Error("Fecha u hora inválida.");
  }

  const clientId = readText(formData, "clientId");
  const projectId = readText(formData, "projectId");

  const event = await prisma.event.create({
    data: {
      userId: user.id,
      title,
      type: readType(formData),
      startAt,
      endAt,
      location: readText(formData, "location"),
      notes: readText(formData, "notes"),
      clientId,
      projectId,
    },
    select: EVENT_SELECT,
  });

  revalidatePath("/");
  revalidatePath("/agenda");

  return serializeEvent(event);
}
