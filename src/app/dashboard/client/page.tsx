import { redirect } from "next/navigation";
import { ClientDashboardPanel } from "@/components/dashboard/client-dashboard-panel";
import { loginPath } from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/session";

const clientDashboardPath = "/dashboard/client";

export default async function ClientDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(loginPath(clientDashboardPath));
  }

  return (
    <main className="min-h-screen bg-[#F7F0E8] px-6 py-8 text-stone-950">
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-mono text-xs uppercase text-stone-500">Client workspace</p>
        <h1 className="mt-2 text-4xl font-semibold">Client dashboard</h1>
        <p className="mt-3 max-w-2xl text-stone-600">
          Your booking requests appear here while owners review availability and
          safety requirements.
        </p>
        <div className="mt-8">
          <ClientDashboardPanel />
        </div>
      </div>
    </main>
  );
}
