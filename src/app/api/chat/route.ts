import { NextRequest } from "next/server";
import type { Content } from "@google/genai";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { requireWorkspaceMembership } from "@/lib/workspace-access";
import { prisma } from "@/lib/prisma";
import { processBudgetRequest } from "@/lib/process-budget-request";

export const runtime = "nodejs";

const KICKOFF_SYSTEM_PROMPT = `Eres el asistente de presupuestos de "Diseño Creativo". Conversas en español con el dueño del estudio.

Tu única tarea en este mensaje es saludar brevemente y pedir, en un solo bloque, los datos necesarios para armar el presupuesto: nombre del cliente, país, empresa (opcional), servicio o tipo de proyecto, cantidad/alcance, moneda si no es obvia por el país, fecha límite (opcional) y notas (opcional). No hagas nada más en este mensaje — no calcules nada, no hagas preguntas adicionales, solo pide esos datos en un solo bloque claro.

Tu mensaje se renderiza como Markdown real (encabezados #/##, listas con "-", negritas). Usa emojis con moderación (✨👤💼💶📅), nunca el carácter "•".`;

const KICKOFF_INSTRUCTION = "(Este es un presupuesto nuevo. Envía ahora el mensaje fijo pidiendo los datos de intake.)";

export async function POST(request: NextRequest) {
  const { quoteId, message, kickoff } = (await request.json()) as {
    quoteId: string;
    message?: string;
    kickoff?: boolean;
  };

  let workspaceId: string;
  let userId: string;
  try {
    const context = await requireWorkspaceMembership();
    workspaceId = context.workspace.id;
    userId = context.user.id;
  } catch {
    return new Response("No autorizado.", { status: 403 });
  }
  const quote = await prisma.quote.findFirst({ where: { id: quoteId, workspaceId } });
  if (!quote) {
    return new Response("No autorizado.", { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        if (kickoff) {
          // Saludo inicial: texto libre en streaming, sin JSON ni acceso a la
          // base de datos todavía (no hay nada que procesar en este turno).
          const contents: Content[] = [{ role: "user", parts: [{ text: KICKOFF_INSTRUCTION }] }];
          const responseStream = await genAI.models.generateContentStream({
            model: GEMINI_MODEL,
            contents,
            config: { systemInstruction: KICKOFF_SYSTEM_PROMPT },
          });

          let assistantText = "";
          for await (const chunk of responseStream) {
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              if (part.text) {
                assistantText += part.text;
                send({ type: "text", text: part.text });
              }
            }
          }

          if (assistantText.trim()) {
            await prisma.conversationMessage.create({
              data: { quoteId, role: "assistant", content: assistantText },
            });
          }
        } else {
          const text = (message ?? "").trim();
          if (!text) {
            send({ type: "error", message: "Mensaje vacío." });
            return;
          }

          const result = await processBudgetRequest(text, quoteId, workspaceId, userId);
          send({ type: "quote_updated", quote: result.quote });
          send({ type: "text", text: result.summary });
        }
      } catch (error) {
        console.error("Error al procesar el chat de presupuesto", error);
        send({ type: "error", message: "No se pudo procesar el mensaje. Revisa los datos e inténtalo de nuevo." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

export type ChatMessage = { role: "user" | "assistant"; content: string };
