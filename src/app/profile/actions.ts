"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/current-user";

// Límite generoso para un avatar ya redimensionado en el cliente (~256px, JPEG) —
// evita que un data URL fuera de lo normal llegue a guardarse en la base de datos.
const MAX_AVATAR_DATA_URL_LENGTH = 500_000;

export async function updateDisplayName(displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) {
    throw new Error("El nombre no puede estar vacío.");
  }

  const user = await getCurrentUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { displayName: trimmed },
  });

  revalidatePath("/", "layout");
}

export async function updateAvatar(dataUrl: string) {
  if (!dataUrl.startsWith("data:image/") || dataUrl.length > MAX_AVATAR_DATA_URL_LENGTH) {
    throw new Error("Imagen inválida.");
  }

  const user = await getCurrentUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: dataUrl },
  });

  revalidatePath("/", "layout");
}
