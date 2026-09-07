import type { Content } from "@google/genai";
import type { Prisma } from "@/generated/prisma/client";
import { genAI, GEMINI_MODEL } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";
import { resolveCountry, round2, type QuoteCurrency } from "@/lib/quote-pricing";
import { serializeQuote, type QuoteSnapshot } from "@/lib/quote-presenter";
import {
  SOCIAL_SERVICE_CODES,
  isSocialServiceCode,
  computeSocialLine,
  computeProjectSurcharges,
  buildPricingBreakdownMarkdown,
  type SocialServiceCode,
  type SocialLineResult,
  type SurchargeLine,
  type UrgencyLevel,
} from "@/lib/social-pricing";
import {
  WEB_SERVICE_CODES,
  isWebServiceCode,
  computeWebLine,
  computeWebSurcharges,
  type WebServiceCode,
  type WebExtras,
} from "@/lib/web-pricing";

// Esquema JSON que Gemini debe devolver en cada turno (modo respuesta
// estructurada de la API — el propio modelo no puede desviarse de esto).
const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    client: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nombre del cliente. Cadena vacía si aún no se sabe." },
        company: { type: "string", description: "Empresa del cliente. Cadena vacía si no aplica." },
        country: {
          type: "string",
          description: "País del cliente (España o México). Cadena vacía si aún no se sabe.",
        },
      },
      required: ["name", "company", "country"],
    },
    services: {
      type: "array",
      description: "Líneas de servicio del presupuesto. Array vacío si todavía falta información esencial.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          quantity: { type: "number" },
          unitPrice: { type: "number" },
          currency: { type: "string", enum: ["MXN", "EUR"] },
        },
        required: ["name", "description", "quantity", "unitPrice", "currency"],
      },
    },
    deliveryTime: { type: "string", description: "Tiempo de entrega estimado. Cadena vacía si no se sabe." },
    revisions: { type: "number", description: "Rondas de ajustes incluidas. 0 si no aplica." },
    notes: { type: "string", description: "Notas adicionales. Cadena vacía si no hay." },
    socialServices: {
      type: "array",
      description:
        "Líneas del catálogo OFICIAL de redes sociales pedidas por el cliente (posts, carruseles, historias, reels básicos, slides extra de carrusel, revisiones adicionales). Usa el código exacto del catálogo y la cantidad — nunca el precio: el backend calcula precio, descuento por volumen e IVA. Array vacío si no aplica. Estas líneas NO se repiten en 'services'.",
      items: {
        type: "object",
        properties: {
          code: { type: "string", enum: [...SOCIAL_SERVICE_CODES] },
          quantity: { type: "number" },
        },
        required: ["code", "quantity"],
      },
    },
    socialExtras: {
      type: "object",
      description:
        "Reglas generales del catálogo de redes sociales solicitadas por el cliente. Deja los valores por defecto (NONE / false) si no aplica.",
      properties: {
        urgency: {
          type: "string",
          enum: ["NONE", "H48", "H24"],
          description: "Entrega urgente pedida por el cliente. NONE si no mencionó urgencia.",
        },
        editableFiles: { type: "boolean", description: "true si pidió los archivos fuente/editables del proyecto." },
      },
      required: ["urgency", "editableFiles"],
    },
    webServices: {
      type: "array",
      description:
        "Líneas del catálogo OFICIAL de servicios web pedidas por el cliente (paquetes web, hosting/dominio/correo, mantenimiento mensual, cambios posteriores a una web ya entregada). Usa el código exacto del catálogo y la cantidad — nunca el precio: el backend calcula precio e IVA. Array vacío si no aplica. Estas líneas NO se repiten en 'services'.",
      items: {
        type: "object",
        properties: {
          code: { type: "string", enum: [...WEB_SERVICE_CODES] },
          quantity: { type: "number" },
        },
        required: ["code", "quantity"],
      },
    },
    webExtras: {
      type: "object",
      description:
        "Reglas generales del catálogo web solicitadas por el cliente. Deja los valores por defecto (NONE / false) si no aplica.",
      properties: {
        urgency: {
          type: "string",
          enum: ["NONE", "D7", "D3"],
          description: "Entrega urgente pedida por el cliente: D7 = menos de 7 días, D3 = menos de 3 días. NONE si no mencionó urgencia.",
        },
        multilanguage: { type: "boolean", description: "true si pidió el sitio en varios idiomas." },
      },
      required: ["urgency", "multilanguage"],
    },
    subtotal: { type: "number" },
    taxRate: { type: "number" },
    taxAmount: { type: "number" },
    total: { type: "number" },
    currency: { type: "string", enum: ["MXN", "EUR"] },
    summary: {
      type: "string",
      description:
        "Texto en Markdown para mostrar al usuario en el chat: resumen profesional si el presupuesto quedó completo, o la pregunta de aclaración si falta algo.",
    },
    webDetails: {
      type: "object",
      description:
        "Solo se completa cuando el proyecto es un sitio web (diseño/desarrollo de página web, landing, ecommerce, etc.). Para cualquier otro tipo de servicio, isWebProject debe ser false y el resto de estos campos quedan vacíos.",
      properties: {
        isWebProject: { type: "boolean" },
        summary: {
          type: "string",
          description: "Resumen y enfoque del proyecto web (2-3 párrafos). Cadena vacía si no es proyecto web.",
        },
        menuStructure: {
          type: "array",
          description:
            "Arquitectura de información / estructura de menú propuesta para el sitio. Array vacío si no es proyecto web.",
          items: {
            type: "object",
            properties: {
              label: { type: "string", description: "Nombre de la sección de menú." },
              detail: { type: "string", description: "Qué contiene o para qué sirve esa sección." },
              children: {
                type: "array",
                items: { type: "string" },
                description: "Sub-secciones o elementos del dropdown, si los hay. Array vacío si no aplica.",
              },
            },
            required: ["label", "detail", "children"],
          },
        },
        maintenanceFee: {
          type: "number",
          description:
            "Cuota mensual de mantenimiento sugerida, en la moneda del presupuesto. Piso de 50; puede ser mayor según la complejidad del sitio. 0 si no es proyecto web.",
        },
        maintenanceDescription: {
          type: "string",
          description: "Qué incluye el mantenimiento mensual (monitoreo, backups, seguridad, soporte). Cadena vacía si no aplica.",
        },
        futureScalability: {
          type: "string",
          description:
            "Nota breve sobre posibles fases futuras del sitio (funcionalidades que se podrían sumar después). Cadena vacía si no aplica.",
        },
      },
      required: ["isWebProject", "summary", "menuStructure", "maintenanceFee", "maintenanceDescription", "futureScalability"],
    },
  },
  required: [
    "client",
    "services",
    "deliveryTime",
    "revisions",
    "notes",
    "socialServices",
    "socialExtras",
    "webServices",
    "webExtras",
    "subtotal",
    "taxRate",
    "taxAmount",
    "total",
    "currency",
    "summary",
    "webDetails",
  ],
};

type ExtractedPayload = {
  client: { name: string; company: string; country: string };
  services: Array<{ name: string; description: string; quantity: number; unitPrice: number; currency: string }>;
  deliveryTime: string;
  revisions: number;
  notes: string;
  socialServices: Array<{ code: SocialServiceCode; quantity: number }>;
  socialExtras: { urgency: UrgencyLevel; editableFiles: boolean };
  webServices: Array<{ code: WebServiceCode; quantity: number }>;
  webExtras: WebExtras;
  currency: string;
  summary: string;
  webDetails: {
    isWebProject: boolean;
    summary: string;
    menuStructure: Array<{ label: string; detail: string; children: string[] }>;
    maintenanceFee: number;
    maintenanceDescription: string;
    futureScalability: string;
  };
};

async function buildCatalogContext() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: { pricingRules: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  if (services.length === 0) return "(El catálogo todavía no tiene servicios activos.)";

  return services
    .map((service) => {
      const prices = service.pricingRules
        .map((rule) => `${rule.currency} ${Number(rule.basePrice).toFixed(2)}${rule.unitLabel ? ` / ${rule.unitLabel}` : ""}`)
        .join(", ");
      return `- ${service.name} [${service.category}]${service.description ? ` — ${service.description}` : ""}${
        prices ? ` (precio de referencia: ${prices})` : ""
      }`;
    })
    .join("\n");
}

function buildSystemInstruction(catalogText: string) {
  return `Eres el asistente de presupuestos de "Diseño Creativo". Conversas en español con el dueño del estudio para armar un presupuesto profesional.

CATÁLOGO DE SERVICIOS ACTIVOS — usa estos precios de referencia, nunca inventes precios para un servicio que sí está en esta lista:
${catalogText}

MERCADOS SOPORTADOS: España (moneda EUR, IVA 21%) y México (moneda MXN, IVA 16%). Son los únicos dos países que puedes resolver automáticamente a moneda/impuesto.

Responde ÚNICAMENTE con un objeto JSON que cumpla el esquema de respuesta configurado. Nada de markdown, nada de texto antes o después, nada de bloques de código — solo el JSON.

Reglas:
- Si falta información imprescindible (nombre del cliente, un país reconocible, o un servicio identificable) para completar el presupuesto, deja "services" como array vacío, deja los montos en 0, y usa "summary" para hacer UNA sola pregunta que junte todo lo que falta — nunca varias preguntas separadas ni una por campo.
- Si el país no es España ni México, trátalo igual que información faltante: no lo fuerces a uno de los dos, pide aclaración en "summary".
- Cuando sí tengas todo lo necesario, calcula subtotal, taxAmount y total (el backend los recalcula de todas formas, pero deben ser coherentes) y escribe en "summary" un resumen profesional y breve (cliente, servicio(s), total). No preguntes si desea generar el PDF — ya hay un botón "Exportar PDF" en la app para eso.
- "summary" se renderiza como Markdown real (encabezados #/##, listas con "-", negritas). Usa emojis con moderación (✨👤💼💶📅📊🚀), nunca el carácter "•".

CATÁLOGO OFICIAL DE REDES SOCIALES: cuando el cliente pide posts, carruseles, historias, reels básicos o slides extra de carrusel que correspondan al catálogo oficial (categoría "Redes sociales" en la lista de arriba), NO inventes el precio ni calcules tú el descuento — identifica el código exacto y la cantidad, y ponlos en "socialServices" (nunca los repitas en "services"). Códigos: SOCIAL_POST (post estático), SOCIAL_CAROUSEL (carrusel), SOCIAL_CAROUSEL_EXTRA_SLIDE (slide extra más allá de los 5 incluidos en un carrusel), SOCIAL_STORY (historia), SOCIAL_REEL_BASIC (reel básico). Si pide una revisión/ronda de ajustes adicional a la incluida, añade una línea con code "SOCIAL_EXTRA_REVIEW" y la cantidad de rondas extra. El backend aplica el precio oficial por país, el descuento automático por volumen y el IVA — tú solo detectas qué pidió y cuánto.
Si el cliente pide entrega urgente (24 h o 48 h) o archivos fuente/editables para ese proyecto de redes, complétalo en "socialExtras" (urgency: "H48"/"H24", editableFiles: true) — estos recargos también los calcula el backend. Si no menciona ninguno, deja urgency en "NONE" y editableFiles en false.

CATÁLOGO OFICIAL DE SERVICIOS WEB: cuando el cliente pide alguno de los paquetes web con precio fijo del catálogo oficial (categorías "Servicios web", "Hosting y dominio", "Mantenimiento web" y "Cambios posteriores web" en la lista de arriba), NO inventes el precio — identifica el código exacto y la cantidad, y ponlos en "webServices" (nunca los repitas en "services"). Ejemplos de código: WEB_LANDING, WEB_BASIC, WEB_BUSINESS, WEB_CORPORATE, WEB_PRO, WEB_PORTFOLIO, WEB_RESTAURANT, WEB_QR_MENU, WEB_BOOKING, WEB_BLOG, WEB_ECOMMERCE_BASIC, WEB_ECOMMERCE_PRO, WEB_EXTRA_PAGE (página extra más allá de las incluidas en el paquete), WEB_ADVANCED_FORM, WEB_DATABASE_BASIC, WEB_DATABASE_PRO, WEB_ADMIN_PANEL, WEB_WHATSAPP, WEB_SOCIAL_FEED, WEB_SEO_BASIC, WEB_SEO_ADVANCED. Si además quiere hosting, dominio o correo, añade HOSTING_BASIC/HOSTING_PRO/DOMAIN_ANNUAL/EMAIL_PRO como líneas más. Si quiere mantenimiento mensual, añade MAINTENANCE_BASIC o MAINTENANCE_PRO (cantidad = número de meses si lo especifica, si no 1). Cada proyecto web incluye hasta 2 rondas de cambios menores; si el cliente pide cambios sobre una web YA entregada más allá de eso, usa WEB_CHANGE_TEXT (cambio simple de texto/imagen), WEB_CHANGE_SECTION (nueva sección), WEB_CHANGE_PAGE (nueva página) o WEB_CHANGE_STRUCTURAL (cambio estructural importante). El backend aplica el precio oficial por país y el IVA — tú solo detectas qué pidió y cuánto.
Si el cliente pide entrega urgente (menos de 7 días o menos de 3 días) o el sitio en varios idiomas, complétalo en "webExtras" (urgency: "D7"/"D3", multilanguage: true) — estos recargos también los calcula el backend sobre el subtotal de las líneas web de ese turno. Si no menciona ninguno, deja urgency en "NONE" y multilanguage en false.

PRESUPUESTOS DE SITIOS WEB: cuando el servicio solicitado es el diseño/desarrollo de una página web (landing, sitio corporativo, ecommerce, etc.), además de las líneas normales completa "webDetails" con isWebProject=true:
- summary: resumen y enfoque del proyecto (2-3 párrafos, profesional, específico al alcance que pidió el cliente).
- menuStructure: la arquitectura de información propuesta (secciones del menú principal, con su propósito y sub-elementos si aplica) — infiere una estructura razonable a partir de lo que el cliente describió.
- maintenanceFee: cuota mensual de mantenimiento; nunca menos de 50 (en la moneda del presupuesto), más alta si el proyecto es más complejo (ecommerce, muchas secciones, panel de administración, etc.).
- maintenanceDescription: qué incluye ese mantenimiento (monitoreo, backups, seguridad, soporte).
- futureScalability: qué se podría sumar en una fase 2, si es relevante.
Para cualquier proyecto que NO sea una página web, deja isWebProject=false y el resto de "webDetails" vacío — no lo llenes "por si acaso".`;
}

async function loadHistory(quoteId: string): Promise<Content[]> {
  const messages = await prisma.conversationMessage.findMany({
    where: { quoteId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
}

function parsePayload(rawText: string): ExtractedPayload {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText);
  } catch {
    throw new Error("Gemini no devolvió JSON válido.");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("La respuesta de Gemini no es un objeto JSON.");
  }
  const data = parsed as Record<string, unknown>;

  const client = data.client as Record<string, unknown> | undefined;
  if (!client || typeof client !== "object") {
    throw new Error("Falta el campo 'client' en la respuesta de Gemini.");
  }
  if (!Array.isArray(data.services)) {
    throw new Error("Falta el campo 'services' en la respuesta de Gemini.");
  }
  if (typeof data.summary !== "string" || !data.summary.trim()) {
    throw new Error("Falta el campo 'summary' en la respuesta de Gemini.");
  }

  return {
    client: {
      name: typeof client.name === "string" ? client.name.trim() : "",
      company: typeof client.company === "string" ? client.company.trim() : "",
      country: typeof client.country === "string" ? client.country.trim() : "",
    },
    services: data.services.map((raw) => {
      const item = (raw ?? {}) as Record<string, unknown>;
      return {
        name: typeof item.name === "string" ? item.name : "",
        description: typeof item.description === "string" ? item.description : "",
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 1,
        unitPrice: typeof item.unitPrice === "number" ? item.unitPrice : 0,
        currency: typeof item.currency === "string" ? item.currency : "",
      };
    }),
    deliveryTime: typeof data.deliveryTime === "string" ? data.deliveryTime : "",
    revisions: typeof data.revisions === "number" ? data.revisions : 0,
    notes: typeof data.notes === "string" ? data.notes : "",
    socialServices: parseSocialServices(data.socialServices),
    socialExtras: parseSocialExtras(data.socialExtras),
    webServices: parseWebServices(data.webServices),
    webExtras: parseWebExtras(data.webExtras),
    currency: typeof data.currency === "string" ? data.currency : "",
    summary: data.summary,
    webDetails: parseWebDetails(data.webDetails),
  };
}

function parseSocialServices(raw: unknown): ExtractedPayload["socialServices"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((rawItem) => {
      const item = (rawItem ?? {}) as Record<string, unknown>;
      return {
        code: typeof item.code === "string" ? item.code : "",
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0,
      };
    })
    .filter(
      (item): item is { code: SocialServiceCode; quantity: number } => isSocialServiceCode(item.code) && item.quantity > 0,
    );
}

function parseSocialExtras(raw: unknown): ExtractedPayload["socialExtras"] {
  const data = (raw ?? {}) as Record<string, unknown>;
  const urgency = data.urgency === "H48" || data.urgency === "H24" ? data.urgency : "NONE";
  return { urgency, editableFiles: data.editableFiles === true };
}

function parseWebServices(raw: unknown): ExtractedPayload["webServices"] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((rawItem) => {
      const item = (rawItem ?? {}) as Record<string, unknown>;
      return {
        code: typeof item.code === "string" ? item.code : "",
        quantity: typeof item.quantity === "number" && item.quantity > 0 ? item.quantity : 0,
      };
    })
    .filter(
      (item): item is { code: WebServiceCode; quantity: number } => isWebServiceCode(item.code) && item.quantity > 0,
    );
}

function parseWebExtras(raw: unknown): ExtractedPayload["webExtras"] {
  const data = (raw ?? {}) as Record<string, unknown>;
  const urgency = data.urgency === "D7" || data.urgency === "D3" ? data.urgency : "NONE";
  return { urgency, multilanguage: data.multilanguage === true };
}

function parseWebDetails(raw: unknown): ExtractedPayload["webDetails"] {
  const data = (raw ?? {}) as Record<string, unknown>;
  return {
    isWebProject: data.isWebProject === true,
    summary: typeof data.summary === "string" ? data.summary : "",
    menuStructure: Array.isArray(data.menuStructure)
      ? data.menuStructure.map((rawItem) => {
          const item = (rawItem ?? {}) as Record<string, unknown>;
          return {
            label: typeof item.label === "string" ? item.label : "",
            detail: typeof item.detail === "string" ? item.detail : "",
            children: Array.isArray(item.children)
              ? item.children.filter((c): c is string => typeof c === "string")
              : [],
          };
        })
      : [],
    maintenanceFee: typeof data.maintenanceFee === "number" && data.maintenanceFee > 0 ? data.maintenanceFee : 50,
    maintenanceDescription: typeof data.maintenanceDescription === "string" ? data.maintenanceDescription : "",
    futureScalability: typeof data.futureScalability === "string" ? data.futureScalability : "",
  };
}

export type ProcessBudgetResult = {
  summary: string;
  quote: QuoteSnapshot;
  canExportPdf: boolean;
};

/**
 * Turno completo del flujo de presupuestos: llama a Gemini en modo JSON
 * estructurado, guarda el mensaje del usuario y la respuesta, y aplica el
 * resultado a la base de datos (cliente, líneas de servicio, subtotal, IVA,
 * total). Devuelve el resumen para el chat y el snapshot del presupuesto ya
 * actualizado para refrescar el panel derecho.
 */
export async function processBudgetRequest(message: string, quoteId: string): Promise<ProcessBudgetResult> {
  const text = message.trim();
  if (!text) throw new Error("Mensaje vacío.");

  await prisma.conversationMessage.create({ data: { quoteId, role: "user", content: text } });

  const [history, catalogText] = await Promise.all([loadHistory(quoteId), buildCatalogContext()]);

  const response = await genAI.models.generateContent({
    model: GEMINI_MODEL,
    contents: history,
    config: {
      systemInstruction: buildSystemInstruction(catalogText),
      responseMimeType: "application/json",
      responseJsonSchema: RESPONSE_SCHEMA,
    },
  });

  let payload: ExtractedPayload;
  let summary: string;
  try {
    payload = parsePayload(response.text ?? "");
    summary = payload.summary;
  } catch {
    // JSON inválido o con forma inesperada: no tocamos la base de datos,
    // solo avisamos en el chat para que el usuario pueda reformular.
    summary =
      "⚠️ No pude procesar esa respuesta correctamente. ¿Puedes reformularla o darme los datos de nuevo?";
    await prisma.conversationMessage.create({ data: { quoteId, role: "assistant", content: summary } });
    const quote = await prisma.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } }, notes: true },
    });
    return { summary, quote: serializeQuote(quote), canExportPdf: quote.lineItems.length > 0 && !!quote.client };
  }

  const txResult = await prisma.$transaction(async (tx) => {
    let quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });

    // 1) Cliente: se guarda en cuanto tengamos al menos el nombre, aunque el
    // resto (país, servicios) todavía falte.
    if (payload.client.name) {
      const existing = await tx.client.findFirst({
        where: { name: { equals: payload.client.name, mode: "insensitive" }, archivedAt: null },
      });

      const countryConfig = resolveCountry(payload.client.country);

      const clientId = existing
        ? existing.id
        : (
            await tx.client.create({
              data: {
                name: payload.client.name,
                company: payload.client.company || undefined,
                defaultCurrency: countryConfig?.currency,
              },
            })
          ).id;

      if (existing && payload.client.company && !existing.company) {
        await tx.client.update({ where: { id: clientId }, data: { company: payload.client.company } });
      }

      await tx.quote.update({
        where: { id: quoteId },
        data: {
          clientId,
          currency: countryConfig?.currency ?? quote.currency,
          taxRatePercent: countryConfig?.taxRatePercent ?? quote.taxRatePercent,
        },
      });
      quote = await tx.quote.findUniqueOrThrow({ where: { id: quoteId } });
    }

    // 2) Catálogos oficiales (redes sociales + servicios web): el backend es
    // la única fuente de verdad del precio (tramos de descuento + recargos),
    // Gemini solo detectó qué código/cantidad/extras pidió el cliente.
    let socialResults: SocialLineResult[] = [];
    let surcharges: SurchargeLine[] = [];
    if (payload.socialServices.length > 0 && quote.currency) {
      const currency = quote.currency as QuoteCurrency;
      const computed = await Promise.all(
        payload.socialServices.map((item) => computeSocialLine(item.code, currency, item.quantity)),
      );
      socialResults = computed.filter((line): line is SocialLineResult => line !== null);

      if (socialResults.length > 0) {
        const socialBaseSubtotal = round2(socialResults.reduce((sum, line) => sum + line.lineTotal, 0));
        surcharges = computeProjectSurcharges(socialBaseSubtotal, payload.socialExtras);
      }
    }

    let webResults: SocialLineResult[] = [];
    let webSurcharges: SurchargeLine[] = [];
    if (payload.webServices.length > 0 && quote.currency) {
      const currency = quote.currency as QuoteCurrency;
      const computed = await Promise.all(
        payload.webServices.map((item) => computeWebLine(item.code, currency, item.quantity)),
      );
      webResults = computed.filter((line): line is SocialLineResult => line !== null);

      if (webResults.length > 0) {
        const webBaseSubtotal = round2(webResults.reduce((sum, line) => sum + line.lineTotal, 0));
        webSurcharges = computeWebSurcharges(webBaseSubtotal, payload.webExtras);
      }
    }

    const catalogResults = [...socialResults, ...webResults];
    const allSurcharges = [...surcharges, ...webSurcharges];

    // 3) Líneas genéricas (fotografía, proyectos web a medida, etc.): solo si
    // Gemini ya trae el desglose completo y el presupuesto ya tiene
    // moneda/IVA resueltos (vía este turno o uno previo).
    const hasAnyLine = payload.services.length > 0 || catalogResults.length > 0;
    if (hasAnyLine && quote.currency && quote.taxRatePercent) {
      const genericLines = payload.services.map((service) => ({
        description: service.description ? `${service.name} — ${service.description}` : service.name,
        quantity: service.quantity,
        unitPrice: service.unitPrice,
        lineTotal: round2(service.quantity * service.unitPrice),
        discountPercent: null as number | null,
      }));

      const catalogLines = catalogResults.map((line) => ({
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        discountPercent: line.discountPercent > 0 ? line.discountPercent : null,
      }));

      const surchargeLines = allSurcharges.map((s) => ({
        description: `${s.description} (+${s.percent}%)`,
        quantity: 1,
        unitPrice: s.lineTotal,
        lineTotal: s.lineTotal,
        discountPercent: null as number | null,
      }));

      const allLines = [...genericLines, ...catalogLines, ...surchargeLines];

      const subtotal = round2(allLines.reduce((sum, item) => sum + item.lineTotal, 0));
      const taxRatePercent = Number(quote.taxRatePercent);
      const taxAmount = round2(subtotal * (taxRatePercent / 100));
      const total = round2(subtotal + taxAmount);

      const existingAnswers =
        quote.questionnaireAnswers && typeof quote.questionnaireAnswers === "object"
          ? (quote.questionnaireAnswers as Record<string, unknown>)
          : {};

      await tx.quote.update({
        where: { id: quoteId },
        data: {
          subtotal: subtotal.toFixed(2),
          taxAmount: taxAmount.toFixed(2),
          total: total.toFixed(2),
          deliveryTimeline: payload.deliveryTime || undefined,
          salesDescription: payload.notes || undefined,
          questionnaireAnswers: {
            ...existingAnswers,
            ...(payload.revisions ? { revisions: payload.revisions } : {}),
            ...(payload.webDetails.isWebProject ? { webQuote: payload.webDetails } : {}),
          } as Prisma.InputJsonValue,
          lineItems: {
            deleteMany: {},
            create: allLines.map((item, index) => ({
              description: item.description,
              quantity: item.quantity.toFixed(2),
              unitPrice: item.unitPrice.toFixed(2),
              lineTotal: item.lineTotal.toFixed(2),
              discountPercent: item.discountPercent !== null ? item.discountPercent.toFixed(2) : undefined,
              sortOrder: index,
            })),
          },
        },
      });
    }

    const finalQuote = await tx.quote.findUniqueOrThrow({
      where: { id: quoteId },
      include: { client: true, lineItems: { orderBy: { sortOrder: "asc" } }, notes: true },
    });

    return { quote: finalQuote, catalogResults, allSurcharges };
  });

  // El desglose de precios (cálculo original, % aplicado, ahorro, subtotal,
  // IVA, total) se construye siempre desde los números ya guardados en BD —
  // nunca desde lo que Gemini haya escrito — para garantizar exactitud.
  if (
    (txResult.catalogResults.length > 0 || txResult.allSurcharges.length > 0) &&
    txResult.quote.currency &&
    txResult.quote.taxRatePercent
  ) {
    const breakdown = buildPricingBreakdownMarkdown({
      currency: txResult.quote.currency as QuoteCurrency,
      taxRatePercent: Number(txResult.quote.taxRatePercent),
      lines: txResult.catalogResults,
      surcharges: txResult.allSurcharges,
      subtotal: Number(txResult.quote.subtotal),
      taxAmount: Number(txResult.quote.taxAmount),
      total: Number(txResult.quote.total),
    });
    summary = `${summary}\n${breakdown}`;
  }

  await prisma.conversationMessage.create({ data: { quoteId, role: "assistant", content: summary } });

  const snapshot = serializeQuote(txResult.quote);
  return { summary, quote: snapshot, canExportPdf: snapshot.lineItems.length > 0 && !!snapshot.client };
}
