import { addHours, differenceInMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateBookingFees, getPaymentProvider } from "@/lib/payments";

const bookingSchema = z.object({
  clientId: z.string().uuid(),
  robotId: z.string().uuid(),
  taskDescription: z.string().min(20),
  requestedStart: z.string().datetime(),
  requestedEnd: z.string().datetime(),
  deliveryAddress: z.string().min(5),
  deliveryLatitude: z.number(),
  deliveryLongitude: z.number(),
  safetyAcknowledged: z.literal(true),
});

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid booking payload or missing safety acknowledgement" },
      { status: 400 },
    );
  }

  const robot = await prisma.robot.findUnique({
    where: { id: parsed.data.robotId },
    include: { owner: true },
  });

  if (!robot || robot.status !== "ACTIVE") {
    return NextResponse.json({ error: "Robot is not available for booking" }, { status: 404 });
  }

  const requestedStart = new Date(parsed.data.requestedStart);
  const requestedEnd = new Date(parsed.data.requestedEnd);
  const totalHours = differenceInMinutes(requestedEnd, requestedStart) / 60;

  if (totalHours < Number(robot.minRentalHours)) {
    return NextResponse.json({ error: "Requested duration is too short" }, { status: 400 });
  }

  const subtotal = totalHours * Number(robot.pricePerHour);
  const fees = calculateBookingFees(subtotal, Number(robot.depositAmount));

  const booking = await prisma.booking.create({
    data: {
      clientId: parsed.data.clientId,
      ownerId: robot.ownerId,
      robotId: robot.id,
      taskDescription: parsed.data.taskDescription,
      requestedStart,
      requestedEnd,
      expiresAt: addHours(new Date(), 24),
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryLatitude: parsed.data.deliveryLatitude,
      deliveryLongitude: parsed.data.deliveryLongitude,
      totalHours,
      subtotal,
      clientServiceFee: fees.clientServiceFee,
      ownerServiceFee: fees.ownerServiceFee,
      depositAmount: Number(robot.depositAmount),
      ownerPayout: fees.ownerPayout,
      currency: robot.currency,
      safetyAcknowledged: true,
    },
  });

  const provider = getPaymentProvider();
  const authorization = await provider.authorize({
    bookingId: booking.id,
    amount: { amount: fees.authorizedTotal, currency: robot.currency },
    deposit: { amount: Number(robot.depositAmount), currency: robot.currency },
  });

  await prisma.payment.create({
    data: {
      bookingId: booking.id,
      provider: authorization.provider.toUpperCase() as "STRIPE" | "MPESA" | "MANUAL",
      providerReference: authorization.reference,
      status: authorization.status === "authorized" ? "AUTHORIZED" : "REQUIRES_ACTION",
      authorizedAmount: authorization.amount.amount,
      currency: authorization.amount.currency,
      metadata: authorization.metadata,
    },
  });

  return NextResponse.json({ bookingId: booking.id, payment: authorization }, { status: 201 });
}
