import { NextRequest } from "next/server";
import type { Content, Part } from "@google/genai";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { buildTools } from "@/lib/chat-tools";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 8;

const SYSTEM_PROMPT = `Eres el asistente de presupuestos de "Diseño Creativo". Conversas en español con el dueño del estudio para armar un presupuesto profesional. Tú tomas la iniciativa — el usuario casi no debería tener que pensar qué escribir, solo responder tus preguntas.

Guion de la conversación (cuando el presupuesto es nuevo, inicia tú con algo como "Vamos a crear un presupuesto." y sigue este orden, una pregunta a la vez):
1. Nombre del cliente.
2. País del cliente (España o México — esto define automáticamente moneda e IVA, no lo preguntes por separado). Usa search_clients antes de asumir que es nuevo; si existe, confírmalo y usa set_client con su clientId. Si no existe, usa set_client con name+country (+ company/email/phone si el usuario los da).
3. Empresa (opcional — pregúntalo pero acepta que no aplique).
4. Qué servicio necesita. Usa list_services para conocer el catálogo real y sus precios de referencia — nunca inventes precios ni servicios que no estén en el catálogo. Si un servicio no tiene precio configurado, dilo y pide el precio.

Si el servicio es de categoría "Webs", profundiza antes de armar el presupuesto — decide tú cuáles de estas preguntas aplican según lo que ya sabes: tipo de sitio, número de páginas, si lleva blog, si es ecommerce, idiomas, si necesita SEO, mantenimiento y hosting. Cada respuesta relevante debe reflejarse como una línea extra en el presupuesto (ej. "Extra: SEO") o en questionnaireAnswers. Para otras categorías, pregunta solo lo necesario para dimensionar el servicio (cantidad, alcance, urgencia).

Llama a update_quote_items cada vez que el desglose cambie (agregar el servicio principal, agregar un extra, aplicar un descuento) — no esperes a tener todo listo, así el usuario ve la vista previa actualizarse en vivo. Antes de update_quote_items siempre debe haberse llamado set_client.

Sé breve y directo, una pregunta a la vez. Si falta información esencial, pregunta antes de asumir.`;

const KICKOFF_INSTRUCTION =
  "(Este es un presupuesto nuevo, sin conversación previa. Inicia tú el flujo guiado ahora, como indica tu guion.)";

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  const { quoteId, message, kickoff } = (await request.json()) as {
    quoteId: string;
    message?: string;
    kickoff?: boolean;
  };

  const user = await getCurrentUser();
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });
  if (quote.userId !== user.id) {
    return new Response("No autorizado.", { status: 403 });
  }

  const priorMessages = await prisma.conversationMessage.findMany({
    where: { quoteId },
    orderBy: { createdAt: "asc" },
  });

  const contents: Content[] = priorMessages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (kickoff) {
    contents.push({ role: "user", parts: [{ text: KICKOFF_INSTRUCTION }] });
  } else {
    const text = (message ?? "").trim();
    if (!text) {
      return new Response("Mensaje vacío.", { status: 400 });
    }
    await prisma.conversationMessage.create({ data: { quoteId, role: "user", content: text } });
    contents.push({ role: "user", parts: [{ text }] });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      const tools = buildTools({ quoteId });
      const toolsByName = new Map(tools.map((tool) => [tool.declaration.name!, tool]));
      const functionDeclarations = tools.map((tool) => tool.declaration);

      let assistantText = "";

      try {
        for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration++) {
          const responseStream = await genAI.models.generateContentStream({
            model: GEMINI_MODEL,
            contents,
            config: {
              systemInstruction: SYSTEM_PROMPT,
              tools: [{ functionDeclarations }],
            },
          });

          const modelParts: Part[] = [];
          const functionCalls: Array<{ name: string; args: Record<string, unknown> }> = [];

          for await (const chunk of responseStream) {
            const parts = chunk.candidates?.[0]?.content?.parts ?? [];
            for (const part of parts) {
              modelParts.push(part);
              if (part.text) {
                assistantText += part.text;
                send({ type: "text", text: part.text });
              }
              if (part.functionCall?.name) {
                functionCalls.push({
                  name: part.functionCall.name,
                  args: part.functionCall.args ?? {},
                });
              }
            }
          }

          contents.push({ role: "model", parts: modelParts });

          if (functionCalls.length === 0) {
            break;
          }

          const responseParts: Part[] = [];
          for (const call of functionCalls) {
            const tool = toolsByName.get(call.name);
            const result: Record<string, unknown> = tool
              ? await tool.run(call.args).catch((error: unknown) => ({
                  error: error instanceof Error ? error.message : "Error ejecutando la herramienta.",
                }))
              : { error: `Herramienta desconocida: ${call.name}` };

            if (result.quote) {
              send({ type: "quote_updated", quote: result.quote });
            }

            responseParts.push({
              functionResponse: { name: call.name, response: result },
            });
          }

          contents.push({ role: "user", parts: responseParts });
        }

        if (assistantText.trim()) {
          await prisma.conversationMessage.create({
            data: { quoteId, role: "assistant", content: assistantText },
          });
        }
      } catch (error) {
        send({ type: "error", message: error instanceof Error ? error.message : "Error desconocido." });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  });
}

export type { ChatMessage };
