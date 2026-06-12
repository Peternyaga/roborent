import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

const robotSchema = z.object({
  ownerId: z.string().uuid(),
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
  pricePerHour: z.number().positive(),
  pricePerDay: z.number().positive(),
  depositAmount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  availabilityZone: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  requiresOperator: z.boolean().default(false),
});

export async function GET() {
  const robots = await prisma.robot.findMany({
    where: { status: "ACTIVE", isAvailable: true },
    orderBy: { createdAt: "desc" },
    take: 24,
  });

  return NextResponse.json({ robots });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = robotSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid robot payload" }, { status: 400 });
  }

  const owner = await prisma.user.findUnique({
    where: { id: parsed.data.ownerId },
    select: { verificationStatus: true, roles: true },
  });

  if (!owner?.roles.includes("OWNER")) {
    return NextResponse.json({ error: "Only owners can create robots" }, { status: 403 });
  }

  const status = owner.verificationStatus === "VERIFIED" ? "ACTIVE" : "DRAFT";
  const robot = await prisma.robot.create({
    data: {
      ...parsed.data,
      slug: `${slugify(parsed.data.name)}-${crypto.randomUUID().slice(0, 8)}`,
      status,
    },
  });

  return NextResponse.json(
    {
      robot,
      publishBlocked: status === "DRAFT",
      reason:
        status === "DRAFT"
          ? "Owner KYC must be verified before publishing an active robot."
          : null,
    },
    { status: 201 },
  );
}
