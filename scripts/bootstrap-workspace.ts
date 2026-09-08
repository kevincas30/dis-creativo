import { prisma } from "@/lib/prisma";
import { bootstrapWorkspace, parseWorkspaceBootstrapArgs } from "@/lib/workspace-bootstrap";
import type { Prisma } from "@/generated/prisma/client";

async function main() {
  const input = parseWorkspaceBootstrapArgs(process.argv.slice(2));
  const result = await bootstrapWorkspace({
    $transaction: (callback) => prisma.$transaction((transaction) => callback(transaction as Prisma.TransactionClient)),
  }, input);
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se pudo preparar el workspace.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
