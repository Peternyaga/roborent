import { redirect } from "next/navigation";
import { OwnerDashboardPanel } from "@/components/dashboard/owner-dashboard-panel";
import { loginPath } from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/session";

const ownerDashboardPath = "/dashboard/owner";

export default async function OwnerDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect(loginPath(ownerDashboardPath));
  }

  if (!user.roles.includes("OWNER") && !user.roles.includes("ADMIN")) {
    redirect("/dashboard/client");
  }

  return (
    <main className="min-h-screen bg-[#F7F0E8] px-6 py-8 text-stone-950">
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-mono text-xs uppercase text-stone-500">Owner operations</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold">Owner dashboard</h1>
            <p className="mt-3 max-w-2xl text-stone-600">
              Manage robot drafts, publish available listings, and review hiring
              requests from one quiet control room.
            </p>
          </div>
        </div>
        <div className="mt-8">
          <OwnerDashboardPanel />
        </div>
      </div>
    </main>
  );
}
