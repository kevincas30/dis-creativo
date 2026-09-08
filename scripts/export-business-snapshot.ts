import { prisma } from "@/lib/prisma";
import { collectBusinessSnapshot, validateBusinessSnapshot, writeBusinessSnapshot } from "@/lib/business-snapshot";

function outputDirectory(argv: string[]) {
  const index = argv.indexOf("--output-dir");
  const value = index >= 0 ? argv[index + 1] : null;
  if (!value || value.startsWith("--")) throw new Error("Usa --output-dir con una carpeta fuera del repositorio.");
  return value;
}

async function main() {
  const snapshot = await collectBusinessSnapshot(prisma);
  await validateBusinessSnapshot(prisma, snapshot);
  const result = await writeBusinessSnapshot(snapshot, outputDirectory(process.argv.slice(2)));
  console.log(JSON.stringify({ ...result, counts: snapshot.counts }, null, 2));
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : "No se pudo crear el snapshot.");
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
