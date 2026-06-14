import { RobotMarketplace } from "@/components/robots/robot-marketplace";

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#F7F0E8] px-6 py-8 text-stone-950">
      <div className="mx-auto w-full max-w-7xl">
        <div className="mb-6">
          <p className="font-mono text-xs uppercase text-stone-500">Discovery</p>
          <h1 className="mt-2 text-4xl font-semibold">Find the right robot</h1>
          <p className="mt-3 max-w-2xl text-stone-600">
            Start with a plain-language search. Filters stay out of the way until
            you need to narrow the field.
          </p>
        </div>
        <RobotMarketplace />
      </div>
    </main>
  );
}
