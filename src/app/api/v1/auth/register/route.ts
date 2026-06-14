import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDevUser, shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  roles: z.array(z.enum(["CLIENT", "OWNER"])).min(1).default(["CLIENT"]),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = registerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid registration payload" }, { status: 400 });
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const roles = Array.from(new Set(parsed.data.roles));

    if (shouldUseDevAuthStore()) {
      const user = createDevUser({
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        passwordHash,
        roles,
      });

      if (!user) {
        return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
      }

      const response = NextResponse.json(
        {
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roles: user.roles,
            verificationStatus: user.verificationStatus,
          },
        },
        { status: 201 },
      );
      setSessionCookie(response, user.id);

      return response;
    }

    const user = await prisma.user.create({
      data: {
        email: parsed.data.email.toLowerCase(),
        fullName: parsed.data.fullName,
        passwordHash,
        roles,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        roles: true,
        verificationStatus: true,
      },
    });
    const response = NextResponse.json({ user }, { status: 201 });
    setSessionCookie(response, user.id);

    return response;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    throw error;
  }
}
