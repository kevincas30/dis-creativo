import { prisma } from "@/lib/prisma";

function option(name: string) { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; }
async function main() {
  const workspaceName = option("--workspace-name"); const workspaceId = option("--workspace-id"); const dryRun = process.argv.includes("--dry-run");
  if (!workspaceName && !workspaceId) throw new Error("Indica --workspace-name o --workspace-id.");
  const workspace = await prisma.workspace.findFirst({ where: workspaceId ? { id: workspaceId } : { name: workspaceName! } });
  if (!workspace) throw new Error("Workspace no encontrado.");
  const projects = await prisma.project.findMany({ where: { workspaceId: workspace.id }, include: { quote: { select: { total: true, depositKind: true, depositValue: true } } } });
  const candidates = projects.filter((project) => !project.depositExpected && project.quote?.total !== null);
  console.log(JSON.stringify({ dryRun, workspace: workspace.name, projects: projects.length, depositExpectedToFill: candidates.length }));
  if (dryRun) return;
  await prisma.$transaction(async (tx) => {
    for (const project of candidates) {
      const quote = project.quote!; const total = Number(quote.total); const expected = quote.depositKind === "NONE" ? 0 : quote.depositKind === "FULL" ? total : quote.depositKind === "FIXED" ? Math.min(total, Number(quote.depositValue)) : total * Number(quote.depositValue) / 100;
      await tx.project.updateMany({ where: { id: project.id, workspaceId: workspace.id, depositExpected: null }, data: { depositExpected: expected.toFixed(2) } });
    }
  }, { timeout: 30_000, maxWait: 10_000 });
  const missing = await prisma.project.count({ where: { workspaceId: workspace.id, quoteId: { not: null }, depositExpected: null } });
  if (missing) throw new Error(`Quedan ${missing} proyectos con presupuesto sin anticipo esperado.`);
  console.log(JSON.stringify({ ok: true, workspace: workspace.name, updatedDepositExpected: candidates.length }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
