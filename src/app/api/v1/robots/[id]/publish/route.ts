import { NextResponse } from "next/server";
import { findDevRobot, publishDevRobot } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { serializeRobot } from "@/lib/robot-api";
import { requireCurrentUser } from "@/lib/session";

type PublishRobotRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: PublishRobotRouteProps) {
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
      return NextResponse.json({ error: "Only the owner can publish this robot" }, { status: 403 });
    }

    if (robot.photos.length < 1 || robot.description.length < 20) {
      return NextResponse.json({ error: "Robot listing is incomplete" }, { status: 422 });
    }

    const updatedRobot = publishDevRobot(robot.id);

    return NextResponse.json({ robot: serializeRobot(updatedRobot ?? robot) });
  }

  const robot = await prisma.robot.findUnique({
    where: { id },
    select: { id: true, ownerId: true, status: true, photos: true, description: true },
  });

  if (!robot) {
    return NextResponse.json({ error: "Robot not found" }, { status: 404 });
  }

  if (robot.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can publish this robot" }, { status: 403 });
  }

  if (user.verificationStatus !== "VERIFIED") {
    return NextResponse.json(
      {
        error: "Owner KYC must be verified before publishing",
        status: robot.status,
      },
      { status: 409 },
    );
  }

  if (robot.photos.length < 1 || robot.description.length < 20) {
    return NextResponse.json(
      { error: "Robot listing is incomplete" },
      { status: 422 },
    );
  }

  const updatedRobot = await prisma.robot.update({
    where: { id: robot.id },
    data: { status: "ACTIVE" },
  });

  return NextResponse.json({ robot: updatedRobot });
}
