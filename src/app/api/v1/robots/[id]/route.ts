import { NextResponse } from "next/server";
import { findDevRobot, updateDevRobot } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { serializeRobot, updateRobotSchema } from "@/lib/robot-api";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";

type RobotRouteProps = {
  params: Promise<{ id: string }>;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(_request: Request, { params }: RobotRouteProps) {
  const { id } = await params;
  const currentUser = await getCurrentUser();

  if (shouldUseDevAuthStore()) {
    const robot = findDevRobot(id);

    if (!robot) {
      return NextResponse.json({ error: "Robot not found" }, { status: 404 });
    }

    const canViewDraft = currentUser?.id === robot.ownerId;

    if (robot.status !== "ACTIVE" && !canViewDraft) {
      return NextResponse.json({ error: "Robot not found" }, { status: 404 });
    }

    return NextResponse.json({ robot: serializeRobot(robot) });
  }

  const isUuid = uuidPattern.test(id);
  const robot = await prisma.robot.findFirst({
    where: isUuid ? { OR: [{ id }, { slug: id }] } : { slug: id },
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
    return response ?? NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { id } = await params;

  if (shouldUseDevAuthStore()) {
    const robot = findDevRobot(id);

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

    const updatedRobot = updateDevRobot(robot.id, parsed.data);

    return NextResponse.json({ robot: serializeRobot(updatedRobot ?? robot) });
  }

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
