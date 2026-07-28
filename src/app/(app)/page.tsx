import { Plus, BarChart3 } from "lucide-react";
import { createDraftQuote } from "./quotes/actions";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/names";
import QuickActionCard from "@/components/home/QuickActionCard";
import AuroraBackground from "@/components/home/AuroraBackground";
import SummaryCard from "@/components/home/SummaryCard";
import type { QuoteStatus } from "@/generated/prisma/enums";

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return { text: "Buenos días", emoji: "☀️" };
  if (hour >= 12 && hour < 19) return { text: "Buenas tardes", emoji: "🌤️" };
  return { text: "Buenas noches", emoji: "🌙" };
}

async function getSummaryStats(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [statusCounts, monthlyBilling] = await Promise.all([
    prisma.quote.groupBy({
      by: ["status"],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.quote.groupBy({
      by: ["currency"],
      where: {
        userId,
        status: "ACCEPTED",
        issuedAt: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { total: true },
    }),
  ]);

  const countFor = (status: QuoteStatus) =>
    statusCounts.find((entry) => entry.status === status)?._count._all ?? 0;

  return {
    total: statusCounts.reduce((sum, entry) => sum + entry._count._all, 0),
    approved: countFor("ACCEPTED"),
    pending: countFor("DRAFT"),
    sent: countFor("SENT"),
    rejected: countFor("REJECTED"),
    monthlyBilling: monthlyBilling
      .filter((entry): entry is typeof entry & { currency: string } => entry.currency != null)
      .map((entry) => ({ amount: Number(entry._sum.total ?? 0), currency: entry.currency }))
      .filter((entry) => entry.amount > 0),
  };
}

export default async function Home() {
  const user = await getCurrentUser();
  const name = firstNameOf(user.displayName);
  const greeting = greetingFor(new Date().getHours());
  const stats = await getSummaryStats(user.id);

  return (
    <div className="relative flex h-full flex-col items-center justify-center gap-10 overflow-y-auto px-4 py-12">
      <AuroraBackground />

      <div className="animate-fade-in-up space-y-3 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting.text}, {name} {greeting.emoji}
        </h1>
        <p className="text-muted-foreground text-base">¿Qué quieres hacer hoy?</p>
      </div>

      <div className="grid w-full max-w-xl grid-cols-1 gap-3 sm:grid-cols-2">
        <form action={createDraftQuote} className="contents">
          <QuickActionCard
            type="submit"
            icon={Plus}
            label="Nuevo presupuesto"
            description="Arranca una conversación guiada"
            className="animate-fade-in-up w-full"
            style={{ animationDelay: "100ms" }}
          />
        </form>
        <QuickActionCard
          icon={BarChart3}
          label="Estadísticas"
          description="Próximamente"
          disabled
          className="animate-fade-in-up"
          style={{ animationDelay: "140ms" }}
        />
      </div>

      <SummaryCard stats={stats} />
    </div>
  );
}
