import type { FunctionDeclaration } from "@google/genai";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { serializeQuote } from "@/lib/quote-presenter";

type Currency = "MXN" | "EUR";

// Únicos mercados soportados por el estudio (PRD sección 5): cada país resuelve
// automáticamente la moneda y el IVA por defecto del presupuesto.
const COUNTRY_CONFIG: Record<string, { currency: Currency; taxRatePercent: number }> = {
  espana: { currency: "EUR", taxRatePercent: 21 },
  mexico: { currency: "MXN", taxRatePercent: 16 },
};

function normalizeCountry(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();
}

function resolveCountry(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return undefined;
  return COUNTRY_CONFIG[normalizeCountry(value)];
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

const QUOTE_INCLUDE = { client: true, lineItems: { orderBy: { sortOrder: "asc" as const } } };

async function loadQuoteSnapshot(quoteId: string) {
  const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId }, include: QUOTE_INCLUDE });
  return serializeQuote(quote);
}

export type ToolDefinition = {
  declaration: FunctionDeclaration;
  run: (args: Record<string, unknown>) => Promise<Record<string, unknown>>;
};

export function buildTools({ quoteId }: { quoteId: string }): ToolDefinition[] {
  const searchClients: ToolDefinition = {
    declaration: {
      name: "search_clients",
      description:
        "Busca clientes existentes por nombre, empresa o email. Úsalo antes de crear un cliente nuevo, para detectar si ya existe (clientes recurrentes).",
      parametersJsonSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "Texto a buscar en nombre, empresa o email del cliente." },
        },
        required: ["query"],
      },
    },
    run: async (args) => {
      const query = String(args.query ?? "");
      const clients = await prisma.client.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { company: { contains: query, mode: "insensitive" } },
            { email: { contains: query, mode: "insensitive" } },
          ],
        },
        take: 5,
      });
      return { clients };
    },
  };

  const setClient: ToolDefinition = {
    declaration: {
      name: "set_client",
      description:
        "Asigna el cliente de este presupuesto: adjunta uno existente (clientId, de search_clients) o crea uno nuevo (name + country obligatorios). El país determina automáticamente la moneda y el IVA del presupuesto (España→EUR/21%, México→MXN/16%). Úsalo antes de agregar líneas con update_quote_items.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "Id de un cliente ya existente (de search_clients)." },
          name: { type: "string", description: "Nombre del cliente, si se crea uno nuevo." },
          company: { type: "string", description: "Nombre de la empresa, si aplica." },
          country: {
            type: "string",
            description: "País del cliente. Mercados soportados: España, México.",
          },
          email: { type: "string" },
          phone: { type: "string" },
        },
      },
    },
    run: async (args) => {
      const countryConfig = resolveCountry(args.country);
      if (args.country && !countryConfig) {
        return {
          error: `País no reconocido: "${String(args.country)}". Los mercados soportados son España (EUR) y México (MXN). Pide aclaración al usuario.`,
        };
      }

      let clientId: string;

      if (typeof args.clientId === "string" && args.clientId) {
        const existing = await prisma.client.findUniqueOrThrow({ where: { id: args.clientId } });
        clientId = existing.id;
        if (countryConfig && !existing.defaultCurrency) {
          await prisma.client.update({
            where: { id: clientId },
            data: { defaultCurrency: countryConfig.currency },
          });
        }
      } else {
        if (typeof args.name !== "string" || !args.name.trim()) {
          return { error: "Se necesita al menos el nombre del cliente para crearlo." };
        }
        const created = await prisma.client.create({
          data: {
            name: args.name,
            company: typeof args.company === "string" ? args.company : undefined,
            email: typeof args.email === "string" ? args.email : undefined,
            phone: typeof args.phone === "string" ? args.phone : undefined,
            defaultCurrency: countryConfig?.currency,
          },
        });
        clientId = created.id;
      }

      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          clientId,
          currency: countryConfig?.currency,
          taxRatePercent: countryConfig?.taxRatePercent,
        },
      });

      return { quote: await loadQuoteSnapshot(quoteId) };
    },
  };

  const listServices: ToolDefinition = {
    declaration: {
      name: "list_services",
      description:
        "Lista el catálogo de servicios activos del estudio con sus precios de referencia por moneda. Úsalo para saber qué servicios existen y a qué precio, en vez de inventar precios.",
      parametersJsonSchema: { type: "object", properties: {} },
    },
    run: async () => {
      const services = await prisma.service.findMany({
        where: { isActive: true },
        include: { pricingRules: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
      return { services };
    },
  };

  const updateQuoteItems: ToolDefinition = {
    declaration: {
      name: "update_quote_items",
      description:
        "Reemplaza el desglose completo del presupuesto (líneas de servicio y extras) y recalcula subtotal/impuesto/total. Requiere que set_client ya se haya llamado. Llámalo de nuevo cada vez que cambie algo (agregar un extra, ajustar cantidad, aplicar descuento) — siempre con la lista COMPLETA de líneas, no solo las nuevas.",
      parametersJsonSchema: {
        type: "object",
        properties: {
          lineItems: {
            type: "array",
            items: {
              type: "object",
              properties: {
                description: { type: "string" },
                quantity: { type: "number" },
                unitPrice: { type: "number" },
                serviceId: {
                  type: "string",
                  description: "Id del servicio del catálogo, si la línea corresponde a uno.",
                },
              },
              required: ["description", "unitPrice"],
            },
          },
          discountType: { type: "string", enum: ["PERCENTAGE", "FIXED"] },
          discountValue: { type: "number" },
          discountReason: { type: "string" },
          calculationExplanation: {
            type: "string",
            description: "Explicación en lenguaje claro de cómo se llegó al total (uso interno).",
          },
          salesDescription: {
            type: "string",
            description: "Descripción persuasiva del servicio para el cliente (copy de venta).",
          },
          questionnaireAnswers: {
            type: "object",
            description:
              "Respuestas del cuestionario guiado (ej. tipo de web, páginas, blog, ecommerce, idiomas, SEO, mantenimiento, hosting). Se combinan con las respuestas ya guardadas.",
          },
        },
        required: ["lineItems"],
      },
    },
    run: async (args) => {
      const quote = await prisma.quote.findUniqueOrThrow({ where: { id: quoteId } });

      if (!quote.currency || !quote.taxRatePercent) {
        return { error: "Primero define el cliente y su país con set_client antes de armar las líneas." };
      }

      const rawLineItems = Array.isArray(args.lineItems) ? args.lineItems : [];
      if (rawLineItems.length === 0) {
        return { error: "Se necesita al menos una línea para el presupuesto." };
      }

      const lineItems = rawLineItems.map((raw) => {
        const item = raw as Record<string, unknown>;
        return {
          description: String(item.description ?? ""),
          quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
          unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : 0,
          serviceId: typeof item.serviceId === "string" ? item.serviceId : undefined,
        };
      });

      const discountType =
        args.discountType === "PERCENTAGE" || args.discountType === "FIXED" ? args.discountType : undefined;
      const discountValue = typeof args.discountValue === "number" ? args.discountValue : undefined;

      const subtotal = round2(lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));

      let taxableBase = subtotal;
      if (discountType === "PERCENTAGE" && discountValue) {
        taxableBase = round2(subtotal - subtotal * (discountValue / 100));
      } else if (discountType === "FIXED" && discountValue) {
        taxableBase = round2(Math.max(0, subtotal - discountValue));
      }

      const taxRatePercent = Number(quote.taxRatePercent);
      const taxAmount = round2(taxableBase * (taxRatePercent / 100));
      const total = round2(taxableBase + taxAmount);

      const existingAnswers =
        quote.questionnaireAnswers && typeof quote.questionnaireAnswers === "object"
          ? (quote.questionnaireAnswers as Record<string, unknown>)
          : {};
      const newAnswers =
        args.questionnaireAnswers && typeof args.questionnaireAnswers === "object"
          ? (args.questionnaireAnswers as Record<string, unknown>)
          : {};

      await prisma.quote.update({
        where: { id: quoteId },
        data: {
          subtotal: subtotal.toFixed(2),
          discountType,
          discountValue: discountValue?.toFixed(2),
          discountReason: typeof args.discountReason === "string" ? args.discountReason : undefined,
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          calculationExplanation:
            typeof args.calculationExplanation === "string" ? args.calculationExplanation : undefined,
          salesDescription: typeof args.salesDescription === "string" ? args.salesDescription : undefined,
          questionnaireAnswers: { ...existingAnswers, ...newAnswers } as Prisma.InputJsonValue,
          lineItems: {
            deleteMany: {},
            create: lineItems.map((item, index) => ({
              description: item.description,
              quantity: item.quantity.toFixed(2),
              unitPrice: item.unitPrice.toFixed(2),
              lineTotal: round2(item.quantity * item.unitPrice).toFixed(2),
              serviceId: item.serviceId,
              sortOrder: index,
            })),
          },
        },
      });

      return { quote: await loadQuoteSnapshot(quoteId) };
    },
  };

  return [searchClients, setClient, listServices, updateQuoteItems];
}

export { loadQuoteSnapshot };
