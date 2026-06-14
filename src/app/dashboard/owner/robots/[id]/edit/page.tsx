import Link from "next/link";
import { redirect } from "next/navigation";
import { RobotListingForm } from "@/components/robots/robot-listing-form";
import { loginPath } from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/session";

type EditRobotPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditRobotPage({ params }: EditRobotPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  const editPath = `/dashboard/owner/robots/${id}/edit`;

  if (!user) {
    redirect(loginPath(editPath));
  }

  if (!user.roles.includes("OWNER") && !user.roles.includes("ADMIN")) {
    redirect("/dashboard/client");
  }

  return (
    <main className="min-h-screen bg-[#F7F0E8] px-6 py-8 text-stone-950">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase text-stone-500">Owner console</p>
            <h1 className="mt-2 text-4xl font-semibold">Edit robot profile</h1>
          </div>
          <Link
            className="rounded-md border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800"
            href="/dashboard/owner"
          >
            Dashboard
          </Link>
        </div>
        <RobotListingForm robotId={id} />
      </div>
    </main>
  );
}
