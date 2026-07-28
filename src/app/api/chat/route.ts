import { NextRequest } from "next/server";
import type { Content, Part } from "@google/genai";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { buildTools } from "@/lib/chat-tools";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_TOOL_ITERATIONS = 8;

const SYSTEM_PROMPT = `Eres el asistente de presupuestos de "Diseño Creativo". Conversas en español con el dueño del estudio para armar un presupuesto profesional. Tu prioridad es resolver todo en el menor número de intercambios posible — cada mensaje de ida y vuelta cuesta cuota de la API, así que evita preguntas innecesarias o repartidas.

El usuario ya recibió un mensaje fijo pidiéndole, en un solo bloque: cliente, país, empresa (opcional), servicio o tipo de proyecto, cantidad/alcance, moneda, fecha límite (opcional) y notas (opcional).

Cuando responda con esa información — aunque venga desordenada, incompleta o en prosa libre — resuelve TODO en el mismo turno, sin preguntar de vuelta salvo que falte algo imprescindible:
1. Con el nombre y país: usa search_clients para ver si el cliente ya existe. Si existe, confírmalo y usa set_client con su clientId. Si no, usa set_client con name+country (+ company/email/phone si los dio). El país determina automáticamente moneda e IVA (España→EUR/21%, México→MXN/16%) — no lo preguntes por separado salvo que el país no sea uno de estos dos mercados.
2. Usa list_services para conocer el catálogo real y sus precios de referencia — nunca inventes precios ni servicios que no estén ahí. Identifica el o los servicios que mejor calzan con lo que pidió el usuario.
3. Si el servicio es de categoría "Webs" y la descripción ya trae suficiente detalle (tipo de sitio, páginas, blog, ecommerce, idiomas, SEO, mantenimiento, hosting), úsalo directamente y refleja cada extra relevante como línea aparte o en questionnaireAnswers. Si falta algo esencial para cotizar con precisión, pide TODO lo que falte en una sola pregunta consolidada — nunca una pregunta por campo.
4. Llama a update_quote_items con el desglose completo (servicio principal + extras que apliquen) en cuanto tengas datos suficientes. Requiere que set_client ya se haya llamado.
5. Cierra con un resumen breve y claro (cliente, servicio(s), total) y pregunta únicamente: "¿Deseas generar el presupuesto?".

Solo te apartas de "una respuesta del usuario → presupuesto resuelto" si falta un dato imprescindible (nombre del cliente, un país reconocible, o un servicio identificable en el catálogo) o algo es genuinamente ambiguo — en ese caso haz UNA sola pregunta que junte todo lo que falta, nunca varias preguntas separadas ni una por campo.

Mantén un tono profesional y conversacional, pero prioriza siempre la eficiencia: menos mensajes, no más.

Tus mensajes se renderizan como Markdown real (encabezados #/##/###, listas, negritas, cursivas, bloques de código con \`\`\`, tablas, separadores con ---). Usa listas con guiones ("- ") para desgloses y viñetas — nunca uses el carácter "•" ni líneas sueltas sin marcador, porque un salto de línea simple se colapsa en Markdown. Usa negritas para resaltar el total u otros datos clave. En el resumen final, un encabezado ("## Resumen" o similar) y una lista o tabla del desglose se ven mejor que un párrafo largo.

Usa emojis con moderación para mejorar la lectura, no en cada línea: ✨ para secciones importantes, 👤 cliente, 💼 servicio, 💶 moneda/precio, 📅 fechas, 📊 resúmenes, 🚀 para el cierre o la acción final. Mantén el tono profesional — el emoji apoya la lectura, no la reemplaza.`;

const KICKOFF_INSTRUCTION =
  "(Este es un presupuesto nuevo. Si el usuario todavía no recibió el mensaje fijo de intake, envíaselo ahora; si ya lo recibió y respondió, continúa el flujo desde ahí.)";

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
