import { SlidersHorizontal } from "lucide-react";
import { RobotCard } from "@/components/robot-card";
import { featuredRobots } from "@/data/robots";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#0A0E1A] px-6 py-8 text-[#F0F4FF]">
      <div className="mx-auto grid w-full max-w-7xl gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="h-fit rounded-lg border border-[#1E2A42] bg-[#131929] p-5">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Search robots</h1>
            <SlidersHorizontal size={18} className="text-[#00CFFF]" />
          </div>
          {["Category", "Price per hour", "Operator", "Safety rating", "Available now"].map(
            (filter) => (
              <label
                className="mb-4 block border-b border-[#1E2A42] pb-4 text-sm text-[#8A9BC4]"
                key={filter}
              >
                <span className="mb-2 block text-[#F0F4FF]">{filter}</span>
                <input
                  className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-2 text-[#F0F4FF] outline-none focus:border-[#00CFFF]"
                  placeholder="Any"
                />
              </label>
            ),
          )}
        </aside>
        <section>
          <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
                Discovery
              </p>
              <h2 className="mt-2 text-3xl font-semibold">Verified marketplace results</h2>
            </div>
            <button className="rounded-md border border-[#1E2A42] px-4 py-2 text-sm text-[#B8C4E8]">
              Map view
            </button>
          </div>
          <div className="grid gap-5 xl:grid-cols-3">
            {featuredRobots.map((robot) => (
              <RobotCard robot={robot} key={robot.slug} />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
