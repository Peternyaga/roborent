import { NextResponse } from "next/server";
import { z } from "zod";
import { decideDevBooking } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

type RejectBookingRouteProps = {
  params: Promise<{ id: string }>;
};

const rejectSchema = z.object({
  reason: z.string().min(3).optional(),
});

export async function PATCH(request: Request, { params }: RejectBookingRouteProps) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response ?? NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = await request.json().catch(() => ({}));
  const parsed = rejectSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid rejection payload" }, { status: 400 });
  }

  const { id } = await params;

  if (shouldUseDevAuthStore()) {
    const booking = decideDevBooking(id, user.id, "REJECTED", parsed.data.reason);

    if (!booking) {
      return NextResponse.json({ error: "Pending booking not found" }, { status: 404 });
    }

    return NextResponse.json({ booking });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ error: "Pending booking not found" }, { status: 404 });
  }

  if (booking.ownerId !== user.id) {
    return NextResponse.json({ error: "Only the owner can reject this request" }, { status: 403 });
  }

  const payment = booking.payments.find((item: { status: string }) => item.status === "AUTHORIZED");

  if (payment?.providerReference) {
    const provider = getPaymentProvider();
    await provider.release({ reference: payment.providerReference });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "REJECTED",
      rejectionReason: parsed.data.reason ?? "Owner declined the request",
      payments: payment
        ? {
            update: {
              where: { id: payment.id },
              data: { status: "RELEASED" },
            },
          }
        : undefined,
    },
    include: { payments: true },
  });

  return NextResponse.json({ booking: updated });
}
