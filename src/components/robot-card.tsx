import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type RobotCardProps = {
  robot: {
    name: string;
    slug: string;
    category: string;
    city: string;
    pricePerHour: number;
    rating: number;
    safetyRating: number;
    requiresOperator: boolean;
    image: string;
    capabilities: string[];
  };
};

export function RobotCard({ robot }: RobotCardProps) {
  return (
    <Link
      href={`/robots/${robot.slug}`}
      className="group relative isolate overflow-hidden rounded-lg border border-[#1E2A42] bg-[#131929] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-[#00CFFF]/60"
    >
      <div
        className="h-56 bg-cover bg-center"
        style={{ backgroundImage: `url(${robot.image})` }}
      />
      <div className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-[#00CFFF]/20 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
              {robot.category}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#F0F4FF]">{robot.name}</h3>
            <p className="text-sm text-[#8A9BC4]">{robot.city}</p>
          </div>
          <div className="rounded-md border border-[#00CFFF]/25 bg-[#00CFFF]/10 px-3 py-2 text-right">
            <p className="text-sm font-semibold text-[#F0F4FF]">
              {formatCurrency(robot.pricePerHour)}
            </p>
            <p className="text-xs text-[#8A9BC4]">per hour</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {robot.capabilities.map((capability) => (
            <span
              className="rounded-md border border-[#1E2A42] bg-[#0A0E1A] px-2.5 py-1 text-xs text-[#B8C4E8]"
              key={capability}
            >
              {capability}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-[#1E2A42] pt-4 text-sm text-[#8A9BC4]">
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#FFB800]" /> {robot.rating}
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#00D68F]" /> Safety{" "}
            {robot.safetyRating}
          </span>
          <span>{robot.requiresOperator ? "Operator" : "Self-serve"}</span>
        </div>
      </div>
    </Link>
  );
}
