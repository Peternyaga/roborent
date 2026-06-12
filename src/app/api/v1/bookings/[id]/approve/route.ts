import { NextResponse } from "next/server";
import { getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";

type ApproveBookingRouteProps = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, { params }: ApproveBookingRouteProps) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { payments: true },
  });

  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ error: "Pending booking not found" }, { status: 404 });
  }

  const payment = booking.payments.find((item) => item.status === "AUTHORIZED");

  if (!payment?.providerReference) {
    return NextResponse.json({ error: "No authorized payment to capture" }, { status: 409 });
  }

  const provider = getPaymentProvider();
  await provider.capture({
    reference: payment.providerReference,
    amount: {
      amount: Number(booking.subtotal) + Number(booking.clientServiceFee) + Number(booking.depositAmount),
      currency: booking.currency,
    },
  });

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "APPROVED",
      confirmedStart: booking.requestedStart,
      confirmedEnd: booking.requestedEnd,
      payments: {
        update: {
          where: { id: payment.id },
          data: {
            status: "CAPTURED",
            capturedAmount:
              Number(booking.subtotal) +
              Number(booking.clientServiceFee) +
              Number(booking.depositAmount),
          },
        },
      },
    },
    include: { payments: true },
  });

  return NextResponse.json({ booking: updated });
}
