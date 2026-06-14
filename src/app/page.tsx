import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { RobotCard } from "@/components/robot-card";
import { featuredRobots } from "@/data/robots";

export default function Home() {
  return (
    <main className="bg-[#F7F0E8] text-stone-950">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-[#FFFDF8] px-3 py-2 text-sm text-stone-600">
            <ShieldCheck size={16} className="text-emerald-700" />
            Verified owners, reviewable robots, approval-based requests.
          </div>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-stone-950 md:text-7xl">
              RoboRent
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-stone-700">
              A calmer way to hire capable robotic assistants for home, delivery,
              medical, companion, and industrial work. Draft listings, review
              requests, and approve work with clear owner controls.
            </p>
          </div>
          <form className="grid gap-3 rounded-lg border border-stone-300 bg-[#FFFDF8] p-3 md:grid-cols-[1fr_0.8fr_0.7fr_auto]">
            <label className="flex items-center gap-3 rounded-md bg-[#F7F0E8] px-4 py-3 text-stone-500">
              <span className="sr-only">Task</span>
              <input
                className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-500"
                placeholder="What should the robot do?"
              />
            </label>
            <label className="flex items-center gap-3 rounded-md bg-[#F7F0E8] px-4 py-3 text-stone-500">
              <MapPin size={18} />
              <input
                className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-500"
                placeholder="City or region"
              />
            </label>
            <label className="flex items-center gap-3 rounded-md bg-[#F7F0E8] px-4 py-3 text-stone-500">
              <CalendarClock size={18} />
              <input
                className="w-full bg-transparent text-sm text-stone-950 outline-none placeholder:text-stone-500"
                type="date"
              />
            </label>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-stone-950 px-5 py-3 text-sm font-semibold text-[#F7F0E8] transition hover:bg-stone-800"
            >
              Search <ArrowRight size={16} />
            </Link>
          </form>
        </div>
        <div className="relative min-h-[500px] overflow-hidden rounded-lg border border-stone-300 bg-[#FFFDF8]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1400&q=80)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 grid gap-3 p-5 sm:grid-cols-3">
            {["Owner-managed", "Draft to publish", "Date-based requests"].map((item) => (
              <div
                key={item}
                className="rounded-md border border-stone-200/40 bg-[#F7F0E8]/90 px-3 py-3 text-sm font-medium text-stone-950"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-stone-300 bg-[#EFE4D8] py-14">
        <div className="mx-auto w-full max-w-7xl px-6">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase text-stone-500">Featured fleet</p>
              <h2 className="mt-2 text-3xl font-semibold">Robots ready for review</h2>
            </div>
            <Link href="/search" className="text-sm font-semibold text-stone-950 underline">
              View all
            </Link>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {featuredRobots.map((robot) => (
              <RobotCard robot={robot} key={robot.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
