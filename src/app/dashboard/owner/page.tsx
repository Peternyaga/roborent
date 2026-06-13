import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export default function OwnerDashboardPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] px-6 py-8 text-[#F0F4FF]">
      <div className="mx-auto w-full max-w-7xl">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
          Owner operations
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Owner dashboard</h1>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Pending requests", "4"],
            ["Approval window", "24h"],
            ["Projected payout", "$7,420"],
          ].map(([label, value]) => (
            <div className="rounded-lg border border-[#1E2A42] bg-[#131929] p-5" key={label}>
              <p className="text-sm text-[#8A9BC4]">{label}</p>
              <p className="mt-2 text-3xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <section className="mt-6 rounded-lg border border-[#1E2A42] bg-[#131929] p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
            <ShieldCheck className="text-[#00D68F]" />
            <div>
              <h2 className="text-xl font-semibold">KYC required before publishing</h2>
              <p className="mt-1 text-sm text-[#8A9BC4]">
                Robots can be drafted anytime, but only verified owners can publish
                active listings.
              </p>
            </div>
            </div>
            <Link
              className="rounded-md bg-[#00CFFF] px-4 py-3 text-sm font-semibold text-[#0A0E1A]"
              href="/dashboard/owner/robots/new"
            >
              New robot
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
