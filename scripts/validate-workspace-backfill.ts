import { readFile } from "node:fs/promises";
import { prisma } from "@/lib/prisma";
import { parseWorkspaceBackfillArgs, validateWorkspaceBackfill } from "@/lib/workspace-backfill";
import type { collectBusinessSnapshot } from "@/lib/business-snapshot";

type Snapshot = Awaited<ReturnType<typeof collectBusinessSnapshot>>;

function requiredFlag(argv: string[], flag: string) {
  const index = argv.indexOf(flag);
  const value = index >= 0 ? argv[index + 1]?.trim() : null;
  if (!value || value.startsWith("--")) throw new Error(`${flag} necesita un valor.`);
  return value;
}

async function main() {
  const argv = process.argv.slice(2);
  const snapshotPath = requiredFlag(argv, "--snapshot");
  const adminEmail = requiredFlag(argv, "--admin-email");
  const excludedEmail = requiredFlag(argv, "--excluded-email");
  const targetArgs = argv.filter((argument, index) => !["--snapshot", "--admin-email", "--excluded-email"].includes(argument) && !["--snapshot", "--admin-email", "--excluded-email"].includes(argv[index - 1]));
  const snapshot = JSON.parse(await readFile(snapshotPath, "utf8")) as Snapshot;
  const result = await validateWorkspaceBackfill(prisma, { ...parseWorkspaceBackfillArgs(targetArgs), snapshot, adminEmail, excludedEmail });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se pudo validar el backfill.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
