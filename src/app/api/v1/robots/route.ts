import { NextResponse } from "next/server";
import { createDevRobot, listDevRobots } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { robotSchema, serializeRobot } from "@/lib/robot-api";
import { getCurrentUser, requireCurrentUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mine = searchParams.get("mine") === "true";
  const user = mine ? await getCurrentUser() : null;

  if (mine && !user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (shouldUseDevAuthStore()) {
    const robots = listDevRobots({
      ownerId: mine ? user?.id : undefined,
      publicOnly: !mine,
    });

    return NextResponse.json({ robots: robots.map(serializeRobot) });
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
    return response ?? NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  if (!user.roles.includes("OWNER")) {
    return NextResponse.json({ error: "Only owners can create robots" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = robotSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid robot payload" }, { status: 400 });
  }

  if (shouldUseDevAuthStore()) {
    const robot = createDevRobot(
      {
        id: user.id,
        fullName: user.fullName,
        verificationStatus: user.verificationStatus,
      },
      parsed.data,
    );

    return NextResponse.json(
      {
        robot: serializeRobot(robot),
        publishBlocked: user.verificationStatus !== "VERIFIED",
        reason: "Robot saved as draft. Publish when the profile is ready.",
      },
      { status: 201 },
    );
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
