import Link from "next/link";
import { Plus, Calendar } from "lucide-react";
import { createDraftQuote } from "./quotes/actions";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/names";
import QuickActionCard from "@/components/home/QuickActionCard";
import AuroraBackground from "@/components/home/AuroraBackground";
import SummaryCard from "@/components/home/SummaryCard";
import MonthlyBillingCard from "@/components/home/MonthlyBillingCard";
import RecentActivityCard from "@/components/home/RecentActivityCard";
import { getRecentActivity } from "@/lib/activity";
import type { QuoteStatus } from "@/generated/prisma/enums";

const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
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

async function getMonthlyBillingTrend(userId: string) {
  const now = new Date();
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [thisMonthByCurrency, lastMonthByCurrency] = await Promise.all([
    prisma.quote.groupBy({
      by: ["currency"],
      where: { userId, status: { in: ["ACCEPTED", "PAID"] }, issuedAt: { gte: startOfThisMonth, lt: startOfNextMonth } },
      _sum: { total: true },
    }),
    prisma.quote.groupBy({
      by: ["currency"],
      where: { userId, status: { in: ["ACCEPTED", "PAID"] }, issuedAt: { gte: startOfLastMonth, lt: startOfThisMonth } },
      _sum: { total: true },
    }),
  ]);

  const thisMonth = thisMonthByCurrency
    .filter((entry): entry is typeof entry & { currency: string } => entry.currency != null)
    .map((entry) => ({ currency: entry.currency, amount: Number(entry._sum.total ?? 0) }));
  const lastMonth = lastMonthByCurrency
    .filter((entry): entry is typeof entry & { currency: string } => entry.currency != null)
    .map((entry) => ({ currency: entry.currency, amount: Number(entry._sum.total ?? 0) }));

  const primaryCurrency =
    [...thisMonth].sort((a, b) => b.amount - a.amount)[0]?.currency ??
    [...lastMonth].sort((a, b) => b.amount - a.amount)[0]?.currency ??
    "EUR";

  const currentAmount = thisMonth.find((entry) => entry.currency === primaryCurrency)?.amount ?? 0;
  const previousAmount = lastMonth.find((entry) => entry.currency === primaryCurrency)?.amount ?? 0;

  const changePercent = currentAmount > 0 && previousAmount > 0 ? ((currentAmount - previousAmount) / previousAmount) * 100 : null;

  return { currency: primaryCurrency, currentAmount, changePercent };
}

export default async function Home() {
  const user = await getCurrentUser();
  const name = firstNameOf(user.displayName);
  const greeting = greetingFor(new Date().getHours());
  const now = new Date();
  const [stats, billingTrend, recentActivity] = await Promise.all([
    getSummaryStats(user.id),
    getMonthlyBillingTrend(user.id),
    getRecentActivity(user.id, 3),
  ]);

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <AuroraBackground />

      <div className="animate-fade-in-up mx-auto space-y-3 pt-10 pb-14 text-center sm:pt-20 sm:pb-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting}, {name}
        </h1>
        <p className="text-muted-foreground text-base">¿Qué quieres hacer hoy?</p>
      </div>

      <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 pb-12 lg:grid-cols-3 lg:items-stretch">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
            <Link
              href="/presupuestos/agenda"
              className="liquid-glass group focus-visible:ring-accent/40 animate-fade-in-up flex items-center gap-3 rounded-2xl p-4 text-left transition-transform duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:outline-none"
              style={{ "--liquid-glass-border": "rgba(166, 217, 226, 0.18)", animationDelay: "140ms" } as React.CSSProperties}
            >
              <div className="bg-accent-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 ease-out group-hover:scale-105">
                <Calendar className="text-foreground h-5 w-5" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">Agenda</p>
                <p className="text-muted-foreground truncate text-xs">Presupuestos por fecha y seguimiento</p>
              </div>
            </Link>
          </div>

          <MonthlyBillingCard
            currentAmount={billingTrend.currentAmount}
            currency={billingTrend.currency}
            changePercent={billingTrend.changePercent}
            monthLabel={MONTH_NAMES[now.getMonth()]}
          />

          <SummaryCard stats={stats} />
        </div>

        <RecentActivityCard events={recentActivity} />
      </div>
    </div>
  );
}
