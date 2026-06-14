import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { findDevUserByEmail, shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid login payload" }, { status: 400 });
  }

  if (shouldUseDevAuthStore()) {
    const user = findDevUserByEmail(parsed.data.email);

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        roles: user.roles,
        verificationStatus: user.verificationStatus,
      },
    });
    setSessionCookie(response, user.id);

    return response;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);

  if (!valid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      roles: user.roles,
      verificationStatus: user.verificationStatus,
    },
  });
  setSessionCookie(response, user.id);

  return response;
}
