import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  dashboardPathForRoles,
  isSafeRedirectPath,
  safeRedirectPath,
} from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/session";

type LoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const user = await getCurrentUser();
  const params = await searchParams;
  const fallbackPath = user ? dashboardPathForRoles(user.roles) : "/dashboard/client";
  const rawNext = Array.isArray(params.next) ? params.next[0] : params.next;

  if (rawNext && !isSafeRedirectPath(rawNext)) {
    redirect(`/auth/login?next=${encodeURIComponent(fallbackPath)}`);
  }

  const redirectTo = safeRedirectPath(params.next, fallbackPath);

  if (user) {
    redirect(redirectTo);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F0E8] px-6 py-10 text-stone-950">
      <div className="w-full max-w-md">
        <LoginForm redirectTo={redirectTo} />
        <p className="mt-5 text-center text-sm text-stone-600">
          New to RoboRent?{" "}
          <Link
            className="font-semibold text-stone-950 underline"
            href={`/auth/register?next=${encodeURIComponent(redirectTo)}`}
          >
            Create account
          </Link>
        </p>
      </div>
    </main>
  );
}
