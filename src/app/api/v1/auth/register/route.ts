import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  roles: z.array(z.enum(["CLIENT", "OWNER"])).default(["CLIENT"]),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      fullName: parsed.data.fullName,
      passwordHash,
      roles: parsed.data.roles,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roles: true,
      verificationStatus: true,
    },
  });

  return NextResponse.json({ user }, { status: 201 });
}
