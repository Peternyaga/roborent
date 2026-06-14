import Link from "next/link";
import type { ReactNode } from "react";
import { Bot, Home, LayoutDashboard, Plus, Search, UserRound } from "lucide-react";
import { dashboardPathForRoles } from "@/lib/auth-navigation";
import { getCurrentUser } from "@/lib/session";
import { LogoutButton } from "./logout-button";

export async function SiteHeader() {
  const user = await getCurrentUser();
  const isOwner = user?.roles.includes("OWNER") || user?.roles.includes("ADMIN");
  const dashboardPath = user ? dashboardPathForRoles(user.roles) : "/auth/login?next=/dashboard/client";

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-stone-300 bg-[#FFFDF8] px-4 py-5 lg:block">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-base font-bold uppercase text-stone-950"
        >
          <Bot size={22} className="text-stone-700" />
          RoboRent
        </Link>
        <nav className="mt-8 space-y-1">
          <HeaderLink href="/" label="Home" icon={<Home size={16} />} />
          <HeaderLink href="/search" label="Find robots" icon={<Search size={16} />} />
          <HeaderLink href={dashboardPath} label="Dashboard" icon={<LayoutDashboard size={16} />} />
          <HeaderLink
            href={isOwner ? "/dashboard/owner/robots/new" : "/auth/register?next=/dashboard/owner/robots/new"}
            label="List robot"
            icon={<Plus size={16} />}
          />
        </nav>
        <div className="absolute bottom-5 left-4 right-4">
          {user ? (
            <div className="space-y-3 rounded-lg border border-stone-300 bg-[#F7F0E8] p-3">
              <Link href={dashboardPath} className="block truncate text-sm font-semibold text-stone-950">
                {user.fullName}
              </Link>
              <LogoutButton />
            </div>
          ) : (
            <div className="grid gap-2">
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-stone-600 hover:text-stone-950"
                href="/auth/login"
              >
                <UserRound size={16} />
                Log in
              </Link>
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-[#F7F0E8] transition hover:bg-stone-800"
                href="/auth/register"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </aside>
      <header className="sticky top-0 z-30 border-b border-stone-300 bg-[#F7F0E8]/95 backdrop-blur lg:hidden">
        <div className="flex min-h-16 w-full items-center justify-between gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 font-mono text-base font-bold uppercase text-stone-950"
        >
          <Bot size={22} className="text-stone-700" />
          RoboRent
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <HeaderLink href="/search" label="Search" icon={<Search size={16} />} />
          <HeaderLink href={dashboardPath} label="Dashboard" icon={<LayoutDashboard size={16} />} />
          <HeaderLink
            href={isOwner ? "/dashboard/owner/robots/new" : "/auth/register?next=/dashboard/owner/robots/new"}
            label="List robot"
            icon={<Plus size={16} />}
          />
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Link
                href={dashboardPath}
                className="hidden max-w-44 truncate text-sm font-semibold text-stone-700 transition hover:text-stone-950 sm:block"
              >
                {user.fullName}
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-semibold text-stone-700 hover:border-stone-600 hover:text-stone-950"
                href="/auth/login"
              >
                <UserRound size={16} />
                Log in
              </Link>
              <Link
                className="hidden h-10 items-center justify-center rounded-md bg-stone-950 px-4 text-sm font-semibold text-[#F7F0E8] transition hover:bg-stone-800 sm:inline-flex"
                href="/auth/register"
              >
                Register
              </Link>
            </>
          )}
        </div>
        </div>

        <nav className="grid grid-cols-3 border-t border-stone-300 md:hidden">
          <MobileLink href="/search" label="Search" />
          <MobileLink href={dashboardPath} label="Dashboard" />
          <MobileLink
            href={isOwner ? "/dashboard/owner/robots/new" : "/auth/register?next=/dashboard/owner/robots/new"}
            label="List robot"
          />
        </nav>
      </header>
    </>
  );
}

function HeaderLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: ReactNode;
}) {
  return (
    <Link
      className="flex h-10 items-center gap-2 rounded-md px-3 text-sm font-semibold text-stone-600 transition hover:bg-[#EFE4D8] hover:text-stone-950"
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}

function MobileLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      className="flex h-11 items-center justify-center border-r border-stone-300 px-2 text-sm font-semibold text-stone-700 last:border-r-0"
      href={href}
    >
      {label}
    </Link>
  );
}
