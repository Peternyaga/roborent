"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal, Search } from "lucide-react";
import { RobotCard } from "@/components/robot-card";
import { Modal } from "@/components/ui/modal";

type Robot = {
  id: string;
  name: string;
  slug: string;
  category: string;
  availabilityZone: string;
  pricePerHour: number;
  currency: string;
  safetyRating: number | null;
  requiresOperator: boolean;
  photos: string[];
  capabilities: string[];
};

export function RobotMarketplace() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [operator, setOperator] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/robots")
      .then((response) => response.json())
      .then((result) => setRobots(result.robots ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filteredRobots = useMemo(
    () =>
      robots.filter((robot) => {
        const haystack = [
          robot.name,
          robot.category,
          robot.availabilityZone,
          ...robot.capabilities,
        ]
          .join(" ")
          .toLowerCase();
        const matchesQuery = !query || haystack.includes(query.toLowerCase());
        const matchesCategory = !category || robot.category === category;
        const matchesOperator =
          !operator ||
          (operator === "operator" ? robot.requiresOperator : !robot.requiresOperator);

        return matchesQuery && matchesCategory && matchesOperator;
      }),
    [category, operator, query, robots],
  );

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-stone-300 bg-[#FFFDF8] p-3">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="flex items-center gap-3 rounded-md bg-[#F7F0E8] px-4 py-3 text-stone-500">
            <Search size={18} />
            <input
              className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-500"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by task, city, category, or capability"
              value={query}
            />
          </label>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-md border border-stone-300 px-4 py-3 text-sm font-semibold text-stone-800"
            onClick={() => setFiltersOpen(true)}
            type="button"
          >
            <SlidersHorizontal size={16} />
            Filters
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-stone-600">
        <p>{filteredRobots.length} robot{filteredRobots.length === 1 ? "" : "s"} available</p>
        {(category || operator) ? (
          <button
            className="font-semibold text-stone-950 underline"
            onClick={() => {
              setCategory("");
              setOperator("");
            }}
            type="button"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {loading ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div
              className="h-[420px] animate-pulse rounded-lg border border-stone-300 bg-[#FFFDF8]"
              key={item}
            />
          ))}
        </div>
      ) : filteredRobots.length ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {filteredRobots.map((robot) => (
            <RobotCard
              key={robot.id}
              robot={{
                ...robot,
                rating: 4.8,
              }}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-stone-300 bg-[#FFFDF8] p-6 text-sm text-stone-600">
          No robots match this search.
        </div>
      )}

      <Modal
        description="Use filters when the results need narrowing; keep them tucked away until then."
        onClose={() => setFiltersOpen(false)}
        open={filtersOpen}
        title="Filter robots"
      >
        <div className="grid gap-4">
          <label className="space-y-1 text-sm font-medium text-stone-700">
            <span>Category</span>
            <select
              className="w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm text-stone-950 outline-none focus:border-stone-900"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <option value="">Any category</option>
              {["DOMESTIC", "MEDICAL", "INDUSTRIAL", "COMPANION", "DELIVERY", "SECURITY", "CUSTOM"].map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium text-stone-700">
            <span>Operator</span>
            <select
              className="w-full rounded-md border border-stone-300 bg-[#F7F0E8] px-3 py-3 text-sm text-stone-950 outline-none focus:border-stone-900"
              onChange={(event) => setOperator(event.target.value)}
              value={operator}
            >
              <option value="">Any operator mode</option>
              <option value="operator">Requires operator</option>
              <option value="self">Self-serve</option>
            </select>
          </label>
          <button
            className="rounded-md bg-stone-950 px-4 py-3 text-sm font-semibold text-[#F7F0E8]"
            onClick={() => setFiltersOpen(false)}
            type="button"
          >
            Show results
          </button>
        </div>
      </Modal>
    </div>
  );
}
