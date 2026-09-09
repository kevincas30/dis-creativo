import { prisma } from "@/lib/prisma";
import { backfillCommercialClients, parseCommercialBackfillArgs } from "@/lib/client-commercial-backfill";

async function main() {
  const result = await backfillCommercialClients(prisma, parseCommercialBackfillArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => { console.error(error instanceof Error ? error.message : "No se pudo ejecutar el backfill comercial."); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
