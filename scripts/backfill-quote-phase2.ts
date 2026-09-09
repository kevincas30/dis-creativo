import { prisma } from "@/lib/prisma";
import { backfillQuotePhase2, verifyQuotePhase2Backfill } from "@/lib/quote-phase2-backfill";

function args(values: string[]) { const workspace = values.indexOf("--workspace-id"); const dryRun = values.includes("--dry-run"); const workspaceId = workspace >= 0 ? values[workspace + 1] : undefined; if (!workspaceId) throw new Error("Usa --workspace-id <id> [--dry-run]."); return { workspaceId, dryRun }; }
async function main() { const input = args(process.argv.slice(2)); const result = await backfillQuotePhase2(prisma, input.workspaceId, input.dryRun); const validation = input.dryRun ? null : await verifyQuotePhase2Backfill(prisma, input.workspaceId); console.log(JSON.stringify({ dryRun: input.dryRun, ...result, validation }, null, 2)); if (validation && !validation.ok) process.exitCode = 1; }
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
