import { NextResponse } from "next/server";
import { requireWorkspaceMembership } from "@/lib/workspace-access";

/**
 * El chat histórico modificaba Quote y Client turno a turno. Fase 2 lo retira
 * del flujo público: la propuesta sin persistencia vive en /api/quote-proposal
 * y solo la revisión confirmada escribe en la base.
 */
export async function POST() {
  try {
    await requireWorkspaceMembership();
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }
  return NextResponse.json({ error: "El asistente anterior fue sustituido. Abre un nuevo presupuesto para generar una propuesta revisable." }, { status: 410 });
}
