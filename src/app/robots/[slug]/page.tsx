import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { findDevRobot } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { BookingRequestForm } from "@/components/robots/booking-request-form";
import { getCurrentUser } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";

type RobotDetailPageProps = {
  params: Promise<{ slug: string }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function RobotDetailPage({ params }: RobotDetailPageProps) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const robot = await getRobot(slug, user?.id);

  if (!robot) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#F7F0E8] px-6 py-8 text-stone-950">
      <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div
            className="mb-6 h-[460px] rounded-lg border border-stone-300 bg-cover bg-center"
            style={{ backgroundImage: `url(${robot.photos[0]})` }}
          />
          <p className="font-mono text-xs uppercase text-stone-500">{robot.category}</p>
          <h1 className="mt-2 text-5xl font-semibold">{robot.name}</h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-stone-700">
            {robot.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {robot.capabilities.map((capability) => (
              <span
                className="rounded-md border border-stone-300 bg-[#FFFDF8] px-3 py-2 text-sm text-stone-700"
                key={capability}
              >
                {capability}
              </span>
            ))}
          </div>
        </section>
        <aside className="h-fit rounded-lg border border-stone-300 bg-[#FFFDF8] p-5">
          <div className="mb-5 flex items-center justify-between border-b border-stone-200 pb-5">
            <div>
              <p className="text-3xl font-semibold">
                {formatCurrency(robot.pricePerHour, robot.currency)}
              </p>
              <p className="text-sm text-stone-500">per hour</p>
            </div>
            <span className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              <ShieldCheck size={16} /> {robot.safetyRating ?? "Pending"}
            </span>
          </div>
          <BookingRequestForm robotId={robot.id} isAuthenticated={Boolean(user)} />
          <p className="mt-4 text-xs leading-5 text-stone-500">
            Safety waiver and payment authorization are required before the owner
            can approve. Payout is captured on approval.
          </p>
        </aside>
      </div>
    </main>
  );
}

async function getRobot(slugOrId: string, currentUserId?: string) {
  if (shouldUseDevAuthStore()) {
    const robot = findDevRobot(slugOrId);

    if (!robot || (robot.status !== "ACTIVE" && robot.ownerId !== currentUserId)) {
      return null;
    }

    return robot;
  }

  const isUuid = uuidPattern.test(slugOrId);
  const robot = await prisma.robot.findFirst({
    where: isUuid
      ? { OR: [{ id: slugOrId }, { slug: slugOrId }] }
      : { slug: slugOrId },
  });

  if (!robot || (robot.status !== "ACTIVE" && robot.ownerId !== currentUserId)) {
    return null;
  }

  return {
    ...robot,
    pricePerHour: Number(robot.pricePerHour),
    pricePerDay: Number(robot.pricePerDay),
    depositAmount: Number(robot.depositAmount),
    latitude: Number(robot.latitude),
    longitude: Number(robot.longitude),
    weightKg: robot.weightKg === null ? null : Number(robot.weightKg),
    batteryLifeHours:
      robot.batteryLifeHours === null ? null : Number(robot.batteryLifeHours),
    operatingRadius:
      robot.operatingRadius === null ? null : Number(robot.operatingRadius),
    safetyRating: robot.safetyRating === null ? null : Number(robot.safetyRating),
  };
}
