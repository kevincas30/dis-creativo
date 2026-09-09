import { NextResponse } from "next/server";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { findClientDuplicates } from "@/lib/client-commercial-service";

const schema = {
  type: "object",
  properties: {
    client: { type: "object", properties: { name: { type: "string" }, company: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, instagram: { type: "string" }, country: { type: "string" } }, required: ["name", "company", "email", "phone", "instagram", "country"] },
    lines: { type: "array", items: { type: "object", properties: { serviceId: { type: "string" }, description: { type: "string" }, quantity: { type: "number" }, unitPrice: { type: "number" } }, required: ["serviceId", "description", "quantity", "unitPrice"] } },
    currency: { type: "string", enum: ["EUR", "MXN"] },
    deliveryTimeline: { type: "string" }, notes: { type: "string" }, salesDescription: { type: "string" }, termsAndConditions: { type: "string" },
  }, required: ["client", "lines", "currency", "deliveryTimeline", "notes", "salesDescription", "termsAndConditions"],
};

export async function POST(request: Request) {
  const { workspace } = await requireWorkspaceMembership();
  const body = await request.json().catch(() => null) as { description?: string } | null;
  const description = body?.description?.trim();
  if (!description) return NextResponse.json({ error: "Describe el trabajo que necesitas presupuestar." }, { status: 400 });
  if (description.length > 6000) return NextResponse.json({ error: "La descripción es demasiado larga." }, { status: 400 });
  const services = await prisma.service.findMany({ where: { workspaceId: workspace.id, isActive: true }, include: { pricingRules: true }, orderBy: { name: "asc" } });
  const catalog = services.map((service) => `${service.id} | ${service.name} | ${service.description ?? ""} | ${service.pricingRules.map((price) => `${price.currency}:${price.basePrice}`).join(", ")}`).join("\n");
  try {
    const response = await genAI.models.generateContent({ model: GEMINI_MODEL, contents: `Solicitud del estudio:\n${description}`, config: { responseMimeType: "application/json", responseJsonSchema: schema, systemInstruction: `Eres asistente de presupuestos de Diseño Creativo. Devuelve solo JSON. Usa servicios y precios del catálogo cuando coincidan. serviceId debe ser un ID exacto del catálogo o cadena vacía si es personalizado. No inventes contactos: usa cadena vacía para lo que no se mencionó. La propuesta no se guarda todavía. Catálogo:\n${catalog}` } });
    const proposal = JSON.parse(response.text ?? "{}");
    const allowed = new Set(services.map((service) => service.id));
    proposal.lines = Array.isArray(proposal.lines) ? proposal.lines.map((line: Record<string, unknown>) => ({ ...line, serviceId: typeof line.serviceId === "string" && allowed.has(line.serviceId) ? line.serviceId : null, quantity: Number(line.quantity) || 1, unitPrice: Number(line.unitPrice) || 0 })) : [];
    const duplicates = proposal.client && typeof proposal.client === "object"
      ? await findClientDuplicates(prisma, workspace.id, proposal.client as { email?: string | null; phone?: string | null; instagram?: string | null })
      : [];
    return NextResponse.json({ proposal, duplicates });
  } catch {
    return NextResponse.json({ error: "No pude preparar la propuesta. Puedes completar la revisión manualmente." }, { status: 422 });
  }
}
