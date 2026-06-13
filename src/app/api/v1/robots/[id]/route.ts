import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";

type RobotRouteProps = {
  params: Promise<{ id: string }>;
};

const updateRobotSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().min(20).optional(),
  capabilities: z.array(z.string()).min(1).optional(),
  photos: z.array(z.string().url()).min(1).optional(),
  pricePerHour: z.number().positive().optional(),
  pricePerDay: z.number().positive().optional(),
  depositAmount: z.number().min(0).optional(),
  minRentalHours: z.number().int().positive().optional(),
  maxRentalHours: z.number().int().positive().optional().nullable(),
  isAvailable: z.boolean().optional(),
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

export async function GET(_request: Request, { params }: RobotRouteProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  const robot = await prisma.robot.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          fullName: true,
          verificationStatus: true,
        },
      },
    },
  });

  if (!robot) {
    return NextResponse.json({ error: "Robot not found" }, { status: 404 });
  }

  const canViewDraft = currentUser?.id === robot.ownerId;

  if (robot.status !== "ACTIVE" && !canViewDraft) {
    return NextResponse.json({ error: "Robot not found" }, { status: 404 });
  }

  return NextResponse.json({ robot: serializeRobot(robot) });
}

export async function PATCH(request: Request, { params }: RobotRouteProps) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response;
  }

  const { id } = await params;
  const robot = await prisma.robot.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });

  if (!robot) {
    return NextResponse.json({ error: "Robot not found" }, { status: 404 });
  }

  if (robot.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can edit this robot" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = updateRobotSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid robot update payload" }, { status: 400 });
  }

  const updatedRobot = await prisma.robot.update({
    where: { id: robot.id },
    data: parsed.data,
  });

  return NextResponse.json({ robot: serializeRobot(updatedRobot) });
}
