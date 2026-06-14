import Link from "next/link";
import { ShieldCheck, Sparkles } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

type RobotCardProps = {
  robot: {
    id?: string;
    name: string;
    slug: string;
    category: string;
    city?: string;
    availabilityZone?: string;
    pricePerHour: number;
    currency?: string;
    rating: number;
    safetyRating: number | null;
    requiresOperator: boolean;
    image?: string;
    photos?: string[];
    capabilities: string[];
  };
};

export function RobotCard({ robot }: RobotCardProps) {
  const image = robot.image ?? robot.photos?.[0] ?? "";
  const city = robot.city ?? robot.availabilityZone ?? "Available region";
  const visualBackground = image
    ? [
        "linear-gradient(145deg, rgba(247, 240, 232, 0.08), rgba(28, 25, 23, 0.34))",
        `url(${image})`,
        "radial-gradient(circle at 26% 24%, rgba(20, 184, 166, 0.34), transparent 26%)",
        "radial-gradient(circle at 74% 20%, rgba(180, 83, 9, 0.24), transparent 24%)",
        "linear-gradient(135deg, #efe4d8 0%, #c8b99f 48%, #292524 100%)",
      ].join(", ")
    : "radial-gradient(circle at 26% 24%, rgba(20, 184, 166, 0.34), transparent 26%), radial-gradient(circle at 74% 20%, rgba(180, 83, 9, 0.24), transparent 24%), linear-gradient(135deg, #efe4d8 0%, #c8b99f 48%, #292524 100%)";

  return (
    <Link
      href={`/robots/${robot.slug}`}
      className="group relative isolate overflow-hidden rounded-lg border border-stone-300 bg-[#FFFDF8] shadow-sm transition hover:-translate-y-0.5 hover:border-stone-500"
    >
      <div
        className="h-56 bg-cover bg-center"
        style={{ backgroundImage: visualBackground }}
      />
      <div className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-stone-200/40 to-transparent transition duration-700 group-hover:translate-x-[120%]" />
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase text-stone-500">
              {robot.category}
            </p>
            <h3 className="mt-2 text-xl font-semibold text-stone-950">{robot.name}</h3>
            <p className="text-sm text-stone-600">{city}</p>
          </div>
          <div className="rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-2 text-right">
            <p className="text-sm font-semibold text-stone-950">
              {formatCurrency(robot.pricePerHour, robot.currency)}
            </p>
            <p className="text-xs text-stone-500">per hour</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {robot.capabilities.map((capability) => (
            <span
              className="rounded-md border border-stone-300 bg-[#F7F0E8] px-2.5 py-1 text-xs text-stone-700"
              key={capability}
            >
              {capability}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-stone-200 pt-4 text-sm text-stone-600">
          <span className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-700" /> {robot.rating ?? "New"}
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-emerald-700" /> Safety{" "}
            {robot.safetyRating ?? "Pending"}
          </span>
          <span>{robot.requiresOperator ? "Operator" : "Self-serve"}</span>
        </div>
      </div>
    </Link>
  );
}
