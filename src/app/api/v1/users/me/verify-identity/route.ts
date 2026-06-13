import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

const identitySchema = z.object({
  identityDocumentUrl: z.string().url(),
});

export async function POST(request: Request) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response;
  }

  if (!user.roles.includes("OWNER")) {
    return NextResponse.json({ error: "Only owners submit KYC" }, { status: 403 });
  }

  const payload = await request.json();
  const parsed = identitySchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid identity payload" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      identityDocumentUrl: parsed.data.identityDocumentUrl,
      verificationStatus: "PENDING",
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
      verificationStatus: true,
      identityDocumentUrl: true,
    },
  });

  return NextResponse.json({ user: updatedUser });
}
