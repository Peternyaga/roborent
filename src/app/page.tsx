import Link from "next/link";
import { ArrowRight, CalendarClock, MapPin, ShieldCheck } from "lucide-react";
import { RobotCard } from "@/components/robot-card";
import { featuredRobots } from "@/data/robots";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0E1A] text-[#F0F4FF]">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-5">
        <Link href="/" className="font-mono text-lg font-bold uppercase text-[#F0F4FF]">
          RoboRent
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[#8A9BC4] md:flex">
          <Link href="/search">Search</Link>
          <Link href="/dashboard/owner">List a robot</Link>
          <Link href="/dashboard/client">Dashboard</Link>
        </nav>
      </header>
      <main>
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#1E2A42] bg-[#131929] px-3 py-2 text-sm text-[#8A9BC4]">
              <ShieldCheck size={16} className="text-[#00D68F]" />
              Verified robots, mandatory owner KYC, safety-first booking.
            </div>
            <div className="space-y-5">
              <h1 className="max-w-4xl text-5xl font-semibold leading-tight text-[#F0F4FF] md:text-7xl">
                RoboRent
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-[#B8C4E8]">
                Hire capable robotic assistants for domestic, delivery, companion,
                medical, and industrial work with verified owners and approval-based
                payouts.
              </p>
            </div>
            <form className="grid gap-3 rounded-lg border border-[#1E2A42] bg-[#131929] p-3 md:grid-cols-[1fr_0.8fr_0.7fr_auto]">
              <label className="flex items-center gap-3 rounded-md bg-[#0A0E1A] px-4 py-3 text-[#8A9BC4]">
                <span className="sr-only">Task</span>
                <input
                  className="w-full bg-transparent text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]"
                  placeholder="What should the robot do?"
                />
              </label>
              <label className="flex items-center gap-3 rounded-md bg-[#0A0E1A] px-4 py-3 text-[#8A9BC4]">
                <MapPin size={18} />
                <input
                  className="w-full bg-transparent text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]"
                  placeholder="City or region"
                />
              </label>
              <label className="flex items-center gap-3 rounded-md bg-[#0A0E1A] px-4 py-3 text-[#8A9BC4]">
                <CalendarClock size={18} />
                <input
                  className="w-full bg-transparent text-sm text-[#F0F4FF] outline-none placeholder:text-[#8A9BC4]"
                  placeholder="Date"
                />
              </label>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-[#00CFFF] px-5 py-3 text-sm font-semibold text-[#0A0E1A] transition hover:bg-[#00A8D4]"
              >
                Search <ArrowRight size={16} />
              </Link>
            </form>
          </div>
          <div className="relative min-h-[520px] overflow-hidden rounded-lg border border-[#1E2A42] bg-[#131929]">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-80"
              style={{
                backgroundImage:
                  "url(https://images.unsplash.com/photo-1561557944-6e7860d1a7eb?auto=format&fit=crop&w=1400&q=80)",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E1A] via-[#0A0E1A]/25 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 grid gap-3 p-5 sm:grid-cols-3">
              {["KYC gated", "Payout on approval", "Stripe + M-Pesa ready"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-md border border-[#00CFFF]/25 bg-[#0A0E1A]/85 px-3 py-3 text-sm text-[#F0F4FF]"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>
        </section>
        <section className="border-y border-[#1E2A42] bg-[#0D1322] py-14">
          <div className="mx-auto w-full max-w-7xl px-6">
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#00CFFF]">
                  Featured fleet
                </p>
                <h2 className="mt-2 text-3xl font-semibold">Robots ready for review</h2>
              </div>
              <Link href="/search" className="text-sm font-semibold text-[#00CFFF]">
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
    </div>
  );
}
