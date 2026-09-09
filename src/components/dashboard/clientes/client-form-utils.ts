export type ClientFormFeedback = { message: string; field?: string };

/** Traduce validaciones de servidor en feedback visible junto al campo implicado. */
export function clientFormFeedback(error: unknown, fallback: string): ClientFormFeedback {
  const message = error instanceof Error ? error.message : fallback;
  const lower = message.toLocaleLowerCase();
  if (lower.includes("nombre")) return { message, field: "name" };
  if (lower.includes("email")) return { message, field: "email" };
  if (lower.includes("teléfono") || lower.includes("whatsapp")) return { message, field: "phone" };
  if (lower.includes("instagram")) return { message, field: "instagram" };
  if (lower.includes("responsable") || lower.includes("pertenece al workspace")) return { message, field: "responsibleId" };
  if (lower.includes("seguimiento") || lower.includes("fecha")) return { message, field: "followUpDate" };
  return { message };
}

export function clientCreatedMessage(stage: "PROSPECT" | "CLIENT") {
  return stage === "PROSPECT" ? "Prospecto creado" : "Cliente creado";
}
