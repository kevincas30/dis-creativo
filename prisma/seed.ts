import { prisma } from "../src/lib/prisma";

type SeedService = {
  name: string;
  category: string;
  description?: string;
  pricing?: { currency: "MXN" | "EUR"; basePrice: string; unitLabel?: string; notes?: string };
};

const SEED_SERVICES: SeedService[] = [
  {
    name: "Página básica",
    category: "Webs",
    pricing: {
      currency: "EUR",
      basePrice: "350.00",
      unitLabel: "proyecto",
      notes: "Aumenta según dificultad hasta 1000-1500 EUR.",
    },
  },
  {
    name: "Carrusel",
    category: "Diseño de redes",
    pricing: { currency: "MXN", basePrice: "450.00", unitLabel: "pieza" },
  },
  {
    name: "Post normal",
    category: "Diseño de redes",
    pricing: { currency: "MXN", basePrice: "250.00", unitLabel: "pieza" },
  },
  {
    name: "Fotografía",
    category: "Fotografía",
    description: "Precio pendiente de configurar.",
  },
];

async function main() {
  for (const seedService of SEED_SERVICES) {
    const existing = await prisma.service.findFirst({
      where: { name: seedService.name, category: seedService.category },
    });

    const service = existing
      ? await prisma.service.update({
          where: { id: existing.id },
          data: { description: seedService.description },
        })
      : await prisma.service.create({
          data: {
            name: seedService.name,
            category: seedService.category,
            description: seedService.description,
          },
        });

    if (seedService.pricing) {
      await prisma.pricingRule.upsert({
        where: {
          serviceId_currency: {
            serviceId: service.id,
            currency: seedService.pricing.currency,
          },
        },
        create: {
          serviceId: service.id,
          currency: seedService.pricing.currency,
          basePrice: seedService.pricing.basePrice,
          unitLabel: seedService.pricing.unitLabel,
          notes: seedService.pricing.notes,
        },
        update: {
          basePrice: seedService.pricing.basePrice,
          unitLabel: seedService.pricing.unitLabel,
          notes: seedService.pricing.notes,
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
