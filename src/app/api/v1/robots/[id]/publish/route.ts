import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type PublishRobotRouteProps = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, { params }: PublishRobotRouteProps) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response;
  }

  const { id } = await params;
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
