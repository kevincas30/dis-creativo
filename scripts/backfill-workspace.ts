import { prisma } from "@/lib/prisma";
import { backfillWorkspace, parseWorkspaceBackfillArgs } from "@/lib/workspace-backfill";

async function main() {
  const result = await backfillWorkspace(prisma, parseWorkspaceBackfillArgs(process.argv.slice(2)));
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se pudo ejecutar el backfill.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
