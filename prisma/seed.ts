import { prisma } from "../src/lib/prisma";

type SeedPricing = { currency: "MXN" | "EUR"; basePrice: string; unitLabel?: string; notes?: string };
type SeedDiscountRule = { minQty: number; maxQty: number | null; percent: string };

type SeedService = {
  name: string;
  category: string;
  code?: string;
  description?: string;
  pricing?: SeedPricing[];
  discountRules?: SeedDiscountRule[];
};

// Tramos de descuento por volumen compartidos por Post/Historia (0/10/15/20%)
// y por Carrusel/Reel básico (0/5/10/15%) — brief oficial de precios de redes.
const TIERS_POST_STORY: SeedDiscountRule[] = [
  { minQty: 1, maxQty: 3, percent: "0" },
  { minQty: 4, maxQty: 5, percent: "10" },
  { minQty: 6, maxQty: 9, percent: "15" },
  { minQty: 10, maxQty: null, percent: "20" },
];

const TIERS_CAROUSEL_REEL: SeedDiscountRule[] = [
  { minQty: 1, maxQty: 2, percent: "0" },
  { minQty: 3, maxQty: 4, percent: "5" },
  { minQty: 5, maxQty: 7, percent: "10" },
  { minQty: 8, maxQty: null, percent: "15" },
];

const SEED_SERVICES: SeedService[] = [
  {
    name: "Página básica",
    category: "Webs",
    pricing: [
      {
        currency: "EUR",
        basePrice: "350.00",
        unitLabel: "proyecto",
        notes: "Aumenta según dificultad hasta 1000-1500 EUR.",
      },
    ],
  },
  {
    name: "Carrusel",
    category: "Diseño de redes",
    pricing: [{ currency: "MXN", basePrice: "450.00", unitLabel: "pieza" }],
  },
  {
    name: "Post normal",
    category: "Diseño de redes",
    pricing: [{ currency: "MXN", basePrice: "250.00", unitLabel: "pieza" }],
  },
  {
    name: "Fotografía",
    category: "Fotografía",
    description: "Precio pendiente de configurar.",
  },

  // Catálogo oficial de redes sociales (ES/MX) — precios y descuentos exactos
  // del tarifario del estudio. code = identificador estable para el motor de
  // precios (src/lib/social-pricing.ts); no depende de coincidencias de texto.
  {
    name: "Post estático",
    category: "Redes sociales",
    code: "SOCIAL_POST",
    description: "1 diseño cuadrado o vertical, adaptado a Instagram/Facebook. Incluye 1 ronda de cambios.",
    pricing: [
      { currency: "EUR", basePrice: "15.00", unitLabel: "pieza" },
      { currency: "MXN", basePrice: "250.00", unitLabel: "pieza" },
    ],
    discountRules: TIERS_POST_STORY,
  },
  {
    name: "Carrusel",
    category: "Redes sociales",
    code: "SOCIAL_CAROUSEL",
    description: "Hasta 5 slides con portada y diseño coherente. Incluye 1 ronda de cambios.",
    pricing: [
      { currency: "EUR", basePrice: "35.00", unitLabel: "pieza" },
      { currency: "MXN", basePrice: "600.00", unitLabel: "pieza" },
    ],
    discountRules: TIERS_CAROUSEL_REEL,
  },
  {
    name: "Slide extra de carrusel",
    category: "Redes sociales",
    code: "SOCIAL_CAROUSEL_EXTRA_SLIDE",
    description: "Slide adicional más allá de los 5 incluidos en el carrusel.",
    pricing: [
      { currency: "EUR", basePrice: "5.00", unitLabel: "slide" },
      { currency: "MXN", basePrice: "80.00", unitLabel: "slide" },
    ],
  },
  {
    name: "Historia",
    category: "Redes sociales",
    code: "SOCIAL_STORY",
    description: "Diseño de story vertical. Incluye 1 ronda de cambios.",
    pricing: [
      { currency: "EUR", basePrice: "10.00", unitLabel: "pieza" },
      { currency: "MXN", basePrice: "180.00", unitLabel: "pieza" },
    ],
    discountRules: TIERS_POST_STORY,
  },
  {
    name: "Reel básico",
    category: "Redes sociales",
    code: "SOCIAL_REEL_BASIC",
    description: "Edición básica: cortes, música, portada y subtítulos automáticos.",
    pricing: [
      { currency: "EUR", basePrice: "45.00", unitLabel: "pieza" },
      { currency: "MXN", basePrice: "800.00", unitLabel: "pieza" },
    ],
    discountRules: TIERS_CAROUSEL_REEL,
  },
  {
    name: "Revisión adicional",
    category: "Redes sociales",
    code: "SOCIAL_EXTRA_REVIEW",
    description: "Ronda de ajustes extra más allá de la incluida en el servicio.",
    pricing: [
      { currency: "EUR", basePrice: "8.00", unitLabel: "ronda" },
      { currency: "MXN", basePrice: "120.00", unitLabel: "ronda" },
    ],
  },

  // Catálogo oficial de servicios web (ES/MX) — precios exactos del tarifario
  // del estudio. Sin tramos de descuento por volumen (a diferencia de redes
  // sociales); code = identificador estable para src/lib/web-pricing.ts.
  ...(
    [
      ["WEB_LANDING", "Landing page", "Servicios web", "250.00", "4500.00"],
      ["WEB_BASIC", "Web básica", "Servicios web", "350.00", "6500.00"],
      ["WEB_BUSINESS", "Web de negocio", "Servicios web", "550.00", "9500.00"],
      ["WEB_CORPORATE", "Web corporativa", "Servicios web", "650.00", "12000.00"],
      ["WEB_PRO", "Web profesional", "Servicios web", "950.00", "18000.00"],
      ["WEB_PORTFOLIO", "Portfolio profesional", "Servicios web", "450.00", "7500.00"],
      ["WEB_RESTAURANT", "Web para restaurante", "Servicios web", "500.00", "8500.00"],
      ["WEB_QR_MENU", "Menú digital QR", "Servicios web", "180.00", "3200.00"],
      ["WEB_BOOKING", "Sistema de reservas", "Servicios web", "150.00", "3000.00"],
      ["WEB_BLOG", "Blog", "Servicios web", "120.00", "2000.00"],
      ["WEB_ECOMMERCE_BASIC", "Tienda online básica", "Servicios web", "1200.00", "25000.00"],
      ["WEB_ECOMMERCE_PRO", "Tienda online profesional", "Servicios web", "1800.00", "38000.00"],
      ["WEB_EXTRA_PAGE", "Página extra", "Servicios web", "60.00", "1200.00"],
      ["WEB_ADVANCED_FORM", "Formulario avanzado", "Servicios web", "40.00", "900.00"],
      ["WEB_DATABASE_BASIC", "Base de datos básica", "Servicios web", "120.00", "2500.00"],
      ["WEB_DATABASE_PRO", "Base de datos avanzada", "Servicios web", "350.00", "7000.00"],
      ["WEB_ADMIN_PANEL", "Panel administrativo", "Servicios web", "250.00", "5000.00"],
      ["WEB_WHATSAPP", "Integración WhatsApp", "Servicios web", "20.00", "400.00"],
      ["WEB_SOCIAL_FEED", "Integración Instagram / redes", "Servicios web", "30.00", "600.00"],
      ["WEB_SEO_BASIC", "SEO básico", "Servicios web", "80.00", "1500.00"],
      ["WEB_SEO_ADVANCED", "SEO avanzado", "Servicios web", "250.00", "4500.00"],

      ["HOSTING_BASIC", "Hosting anual básico", "Hosting y dominio", "100.00", "1800.00"],
      ["HOSTING_PRO", "Hosting profesional", "Hosting y dominio", "180.00", "3200.00"],
      ["DOMAIN_ANNUAL", "Dominio anual", "Hosting y dominio", "20.00", "400.00"],
      ["EMAIL_PRO", "Correo profesional", "Hosting y dominio", "30.00", "600.00"],

      ["MAINTENANCE_BASIC", "Mantenimiento básico mensual", "Mantenimiento web", "30.00", "600.00"],
      ["MAINTENANCE_PRO", "Mantenimiento profesional mensual", "Mantenimiento web", "60.00", "1200.00"],

      ["WEB_CHANGE_TEXT", "Cambio simple de texto/imagen", "Cambios posteriores web", "15.00", "250.00"],
      ["WEB_CHANGE_SECTION", "Nueva sección", "Cambios posteriores web", "40.00", "700.00"],
      ["WEB_CHANGE_PAGE", "Nueva página", "Cambios posteriores web", "60.00", "1200.00"],
      [
        "WEB_CHANGE_STRUCTURAL",
        "Cambio estructural importante",
        "Cambios posteriores web",
        "80.00",
        "2000.00",
        "Precio de partida; puede ser mayor según la complejidad del cambio.",
      ],
    ] as const
  ).map(
    ([code, name, category, eur, mxn, notes]): SeedService => {
      const unitLabel =
        category === "Hosting y dominio" ? "año" : category === "Mantenimiento web" ? "mes" : "proyecto";
      return {
        code,
        name,
        category,
        pricing: [
          { currency: "EUR", basePrice: eur, unitLabel, notes },
          { currency: "MXN", basePrice: mxn, unitLabel, notes },
        ],
      };
    },
  ),
];

async function main() {
  for (const seedService of SEED_SERVICES) {
    const existing = seedService.code
      ? await prisma.service.findUnique({ where: { code: seedService.code } })
      : await prisma.service.findFirst({
          where: { name: seedService.name, category: seedService.category },
        });

    const service = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: { code: seedService.code, description: seedService.description },
        })
      : await prisma.service.create({
          data: {
            name: seedService.name,
            category: seedService.category,
            code: seedService.code,
            description: seedService.description,
          },
        });

    for (const pricing of seedService.pricing ?? []) {
      await prisma.pricingRule.upsert({
        where: { serviceId_currency: { serviceId: service.id, currency: pricing.currency } },
        create: {
          serviceId: service.id,
          currency: pricing.currency,
          basePrice: pricing.basePrice,
          unitLabel: pricing.unitLabel,
          notes: pricing.notes,
        },
        update: {
          basePrice: pricing.basePrice,
          unitLabel: pricing.unitLabel,
          notes: pricing.notes,
        },
      });
    }

    for (const rule of seedService.discountRules ?? []) {
      await prisma.discountRule.upsert({
        where: { serviceId_minQty: { serviceId: service.id, minQty: rule.minQty } },
        create: {
          serviceId: service.id,
          minQty: rule.minQty,
          maxQty: rule.maxQty,
          percent: rule.percent,
        },
        update: {
          maxQty: rule.maxQty,
          percent: rule.percent,
        },
      });
    }

    console.log(`Servicio listo: ${service.category} / ${service.name}`);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
