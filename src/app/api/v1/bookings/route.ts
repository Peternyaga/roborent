import { addHours, differenceInMinutes } from "date-fns";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createDevBooking, listDevBookings } from "@/lib/dev-marketplace-store";
import { shouldUseDevAuthStore } from "@/lib/dev-auth-store";
import { calculateBookingFees, getPaymentProvider } from "@/lib/payments";
import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/session";

const bookingSchema = z.object({
  robotId: z.string().min(1),
  taskDescription: z.string().min(20),
  requestedStart: z.coerce.date(),
  requestedEnd: z.coerce.date(),
  deliveryAddress: z.string().min(5),
  deliveryLatitude: z.number(),
  deliveryLongitude: z.number(),
  safetyAcknowledged: z.literal(true),
});

function serializeBooking(booking: {
  requestedStart: Date;
  requestedEnd: Date;
  confirmedStart: Date | null;
  confirmedEnd: Date | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...booking,
    requestedStart: booking.requestedStart.toISOString(),
    requestedEnd: booking.requestedEnd.toISOString(),
    confirmedStart: booking.confirmedStart?.toISOString() ?? null,
    confirmedEnd: booking.confirmedEnd?.toISOString() ?? null,
    expiresAt: booking.expiresAt.toISOString(),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
  };
}

export async function GET(request: Request) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response ?? NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") === "owner" ? "owner" : "client";

  if (shouldUseDevAuthStore()) {
    const bookings = listDevBookings(
      role === "owner" ? { ownerId: user.id } : { clientId: user.id },
    );

    return NextResponse.json({ bookings: bookings.map(serializeBooking) });
  }

  const bookings = await prisma.booking.findMany({
    where: role === "owner" ? { ownerId: user.id } : { clientId: user.id },
    include: {
      robot: {
        select: {
          id: true,
          name: true,
          slug: true,
          photos: true,
        },
      },
      client: {
        select: {
          id: true,
          fullName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({ bookings: bookings.map(serializeBooking) });
}

export async function POST(request: Request) {
  const { user, response } = await requireCurrentUser();

  if (!user) {
    return response ?? NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = bookingSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid booking payload or missing safety acknowledgement",
        fields: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  const requestedStart = parsed.data.requestedStart;
  const requestedEnd = parsed.data.requestedEnd;

  if (requestedEnd <= requestedStart) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  if (shouldUseDevAuthStore()) {
    const result = createDevBooking({
      clientId: user.id,
      clientName: user.fullName,
      robotId: parsed.data.robotId,
      taskDescription: parsed.data.taskDescription,
      requestedStart,
      requestedEnd,
      deliveryAddress: parsed.data.deliveryAddress,
      deliveryLatitude: parsed.data.deliveryLatitude,
      deliveryLongitude: parsed.data.deliveryLongitude,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      {
        booking: serializeBooking(result.booking),
        payment: {
          provider: "manual",
          reference: `manual_${result.booking.id}`,
          status: "authorized",
          amount: {
            amount:
              result.booking.subtotal +
              result.booking.clientServiceFee +
              result.booking.depositAmount,
            currency: result.booking.currency,
          },
        },
      },
      { status: 201 },
    );
  }

  const robot = await prisma.robot.findUnique({
    where: { id: parsed.data.robotId },
    include: { owner: true },
  });

  if (!robot || robot.status !== "ACTIVE") {
    return NextResponse.json({ error: "Robot is not available for booking" }, { status: 404 });
  }

  const totalHours = differenceInMinutes(requestedEnd, requestedStart) / 60;

  if (totalHours < Number(robot.minRentalHours)) {
    return NextResponse.json({ error: "Requested duration is too short" }, { status: 400 });
  }

  const subtotal = totalHours * Number(robot.pricePerHour);
  const fees = calculateBookingFees(subtotal, Number(robot.depositAmount));

  const booking = await prisma.booking.create({
    data: {
      clientId: user.id,
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

  return NextResponse.json({ booking, payment: authorization }, { status: 201 });
}
