import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { featuredRobots } from "@/data/robots";
import { formatCurrency } from "@/lib/utils";

type RobotDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RobotDetailPage({ params }: RobotDetailPageProps) {
  const { slug } = await params;
  const robot = featuredRobots.find((item) => item.slug === slug);

  if (!robot) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0A0E1A] px-6 py-8 text-[#F0F4FF]">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div
            className="mb-6 h-[460px] rounded-lg border border-[#1E2A42] bg-cover bg-center"
            style={{ backgroundImage: `url(${robot.image})` }}
          />
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
            {robot.category}
          </p>
          <h1 className="mt-2 text-5xl font-semibold">{robot.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-[#B8C4E8]">
            A verified robotic service listing with capability matching, operator
            clarity, safety ratings, and approval-based payout controls.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {robot.capabilities.map((capability) => (
              <span
                className="rounded-md border border-[#1E2A42] bg-[#131929] px-3 py-2 text-sm text-[#B8C4E8]"
                key={capability}
              >
                {capability}
              </span>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-lg border border-[#1E2A42] bg-[#131929] p-5">
          <div className="mb-5 flex items-center justify-between border-b border-[#1E2A42] pb-5">
            <div>
              <p className="text-3xl font-semibold">
                {formatCurrency(robot.pricePerHour)}
              </p>
              <p className="text-sm text-[#8A9BC4]">per hour</p>
            </div>
            <span className="flex items-center gap-2 rounded-md bg-[#00D68F]/10 px-3 py-2 text-sm text-[#00D68F]">
              <ShieldCheck size={16} /> {robot.safetyRating}
            </span>
          </div>
          <div className="space-y-3">
            <input
              className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
              placeholder="Start date and time"
            />
            <input
              className="w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
              placeholder="End date and time"
            />
            <textarea
              className="min-h-28 w-full rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-3 py-3 text-sm outline-none focus:border-[#00CFFF]"
              placeholder="Describe the task"
            />
            <button className="w-full rounded-md bg-[#00CFFF] px-4 py-3 text-sm font-semibold text-[#0A0E1A] hover:bg-[#00A8D4]">
              Request to hire
            </button>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#8A9BC4]">
            Safety waiver and payment authorization are required before the owner
            can approve. Payout is captured on approval.
          </p>
        </aside>
      </div>
    </main>
  );
}
