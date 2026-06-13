import Link from "next/link";
import { RobotListingForm } from "@/components/robots/robot-listing-form";

export default function NewRobotPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] px-6 py-8 text-[#F0F4FF]">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
              Owner console
            </p>
            <h1 className="mt-2 text-4xl font-semibold">New robot listing</h1>
          </div>
          <Link
            className="rounded-md border border-[#1E2A42] px-4 py-2 text-sm text-[#B8C4E8]"
            href="/dashboard/owner"
          >
            Dashboard
          </Link>
        </div>
        <RobotListingForm />
      </div>
    </main>
  );
}
