import { getCurrentUser } from "@/lib/current-user";
import { firstNameOf } from "@/lib/names";
import DashboardBackground from "@/components/dashboard/DashboardBackground";
import StatsGrid from "@/components/dashboard/StatsGrid";
import QuickAccessGrid from "@/components/dashboard/QuickAccessGrid";
import RecentActivityCard from "@/components/dashboard/RecentActivityCard";
import RecentProjectsCard from "@/components/dashboard/RecentProjectsCard";
import PendingPaymentsCard from "@/components/dashboard/PendingPaymentsCard";
import UpcomingMeetingsCard from "@/components/dashboard/UpcomingMeetingsCard";

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardHome() {
  const user = await getCurrentUser();
  const name = firstNameOf(user.displayName);
  const greeting = greetingFor(new Date().getHours());

  return (
    <div className="relative flex h-full flex-col overflow-y-auto px-6 py-10 sm:px-10 lg:px-16">
      <DashboardBackground />

      <div className="animate-fade-in-up mx-auto space-y-3 pb-10 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          {greeting}, {name}
        </h1>
        <p className="text-muted-foreground text-base">Esto es lo que pasa hoy en el estudio.</p>
      </div>

      <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
        <StatsGrid />

        <QuickAccessGrid />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <RecentActivityCard />
            <RecentProjectsCard />
          </div>

          <div className="flex flex-col gap-4">
            <PendingPaymentsCard />
            <UpcomingMeetingsCard />
          </div>
        </div>
      </div>
    </div>
  );
}
