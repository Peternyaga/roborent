import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

const robotSchema = z.object({
  name: z.string().min(2),
  category: z.enum([
    "DOMESTIC",
    "MEDICAL",
    "INDUSTRIAL",
    "COMPANION",
    "DELIVERY",
    "SECURITY",
    "CUSTOM",
  ]),
  description: z.string().min(20),
  capabilities: z.array(z.string()).min(1),
  photos: z.array(z.string().url()).min(1),
  videoUrl: z.string().url().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  modelNumber: z.string().optional().nullable(),
  yearManufactured: z.number().int().min(1950).max(2100).optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  batteryLifeHours: z.number().positive().optional().nullable(),
  operatingRadius: z.number().positive().optional().nullable(),
  pricePerHour: z.number().positive(),
  pricePerDay: z.number().positive(),
  depositAmount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  minRentalHours: z.number().int().positive().default(1),
  maxRentalHours: z.number().int().positive().optional().nullable(),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT"]).default("MODERATE"),
  availabilityZone: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  requiresOperator: z.boolean().default(false),
});

function serializeRobot(robot: {
  pricePerHour: unknown;
  pricePerDay: unknown;
  depositAmount: unknown;
  latitude: unknown;
  longitude: unknown;
  weightKg: unknown;
  batteryLifeHours: unknown;
  operatingRadius: unknown;
  safetyRating: unknown;
}) {
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";
  const user = mine ? await getCurrentUser() : null;

  if (mine && !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const robots = await prisma.robot.findMany({
    where: mine
      ? { ownerId: user?.id }
      : { status: "ACTIVE", isAvailable: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return NextResponse.json({ robots: robots.map(serializeRobot) });
}

export async function POST(request: Request) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response;
  }

  if (!user.roles.includes("OWNER")) {
    return NextResponse.json({ error: "Only owners can create robots" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = robotSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid robot payload" }, { status: 400 });
  }

  const robot = await prisma.robot.create({
    data: {
      ...parsed.data,
      ownerId: user.id,
      slug: `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 8)}`,
      status: "DRAFT",
    },
  });

  return NextResponse.json(
    {
      robot: serializeRobot(robot),
      publishBlocked: user.verificationStatus !== "VERIFIED",
      reason: "Robot saved as draft. Owner KYC must be verified before publishing.",
    },
    { status: 201 },
  );
}
