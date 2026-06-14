import { addHours, differenceInMinutes } from "date-fns";
import { calculateBookingFees } from "@/lib/payments";
import { featuredRobots } from "@/data/robots";
import { slugify } from "@/lib/utils";

type RobotStatus = "DRAFT" | "ACTIVE" | "SUSPENDED" | "RETIRED";
type BookingStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED"
  | "EXPIRED";

export type DevRobot = {
  id: string;
  ownerId: string;
  slug: string;
  name: string;
  category: string;
  description: string;
  capabilities: string[];
  photos: string[];
  videoUrl: string | null;
  manufacturer: string | null;
  modelNumber: string | null;
  yearManufactured: number | null;
  weightKg: number | null;
  batteryLifeHours: number | null;
  operatingRadius: number | null;
  requiresOperator: boolean;
  pricePerHour: number;
  pricePerDay: number;
  depositAmount: number;
  currency: string;
  minRentalHours: number;
  maxRentalHours: number | null;
  cancellationPolicy: "FLEXIBLE" | "MODERATE" | "STRICT";
  availabilityZone: string;
  latitude: number;
  longitude: number;
  isAvailable: boolean;
  isVerified: boolean;
  safetyRating: number | null;
  status: RobotStatus;
  createdAt: Date;
  updatedAt: Date;
  owner?: {
    id: string;
    fullName: string;
    verificationStatus: string;
  };
};

export type DevBooking = {
  id: string;
  clientId: string;
  clientName: string;
  ownerId: string;
  robotId: string;
  robotName: string;
  taskDescription: string;
  requestedStart: Date;
  requestedEnd: Date;
  confirmedStart: Date | null;
  confirmedEnd: Date | null;
  expiresAt: Date;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
  status: BookingStatus;
  totalHours: number;
  subtotal: number;
  clientServiceFee: number;
  ownerServiceFee: number;
  depositAmount: number;
  ownerPayout: number;
  currency: string;
  safetyAcknowledged: boolean;
  rejectionReason: string | null;
  ownerNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const demoOwnerId = "00000000-0000-4000-8000-000000000001";

const globalForDevMarketplace = globalThis as unknown as {
  roborentDevRobots?: Map<string, DevRobot>;
  roborentDevBookings?: Map<string, DevBooking>;
};

function robots() {
  if (!globalForDevMarketplace.roborentDevRobots) {
    globalForDevMarketplace.roborentDevRobots = new Map(
      featuredRobots.map((robot, index) => [
        `demo-${robot.slug}`,
        {
          id: `demo-${robot.slug}`,
          ownerId: demoOwnerId,
          slug: robot.slug,
          name: robot.name,
          category: robot.category,
          description:
            "A verified robotic service listing with capability matching, operator clarity, safety ratings, and approval-based payout controls.",
          capabilities: robot.capabilities,
          photos: [robot.image],
          videoUrl: null,
          manufacturer: index === 0 ? "Aster Robotics" : "RoboRent Partner",
          modelNumber: `RR-${index + 7}00`,
          yearManufactured: 2025,
          weightKg: null,
          batteryLifeHours: 8,
          operatingRadius: 25,
          requiresOperator: robot.requiresOperator,
          pricePerHour: robot.pricePerHour,
          pricePerDay: robot.pricePerHour * 7,
          depositAmount: Math.round(robot.pricePerHour * 2),
          currency: "USD",
          minRentalHours: 2,
          maxRentalHours: null,
          cancellationPolicy: "MODERATE",
          availabilityZone: robot.city,
          latitude: -1.286389,
          longitude: 36.817223,
          isAvailable: true,
          isVerified: true,
          safetyRating: robot.safetyRating,
          status: "ACTIVE",
          createdAt: new Date(Date.now() - (index + 1) * 86400000),
          updatedAt: new Date(Date.now() - (index + 1) * 86400000),
          owner: {
            id: demoOwnerId,
            fullName: "RoboRent Verified Fleet",
            verificationStatus: "VERIFIED",
          },
        },
      ]),
    );
  }

  return globalForDevMarketplace.roborentDevRobots;
}

function bookings() {
  if (!globalForDevMarketplace.roborentDevBookings) {
    globalForDevMarketplace.roborentDevBookings = new Map();
  }

  return globalForDevMarketplace.roborentDevBookings;
}

export function listDevRobots(options: { ownerId?: string; publicOnly?: boolean }) {
  return Array.from(robots().values())
    .filter((robot) => {
      if (options.ownerId) {
        return robot.ownerId === options.ownerId;
      }

      if (options.publicOnly) {
        return robot.status === "ACTIVE" && robot.isAvailable;
      }

      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function findDevRobot(idOrSlug: string) {
  return (
    robots().get(idOrSlug) ??
    Array.from(robots().values()).find((robot) => robot.slug === idOrSlug) ??
    null
  );
}

export function createDevRobot(owner: { id: string; fullName: string; verificationStatus: string }, data: Record<string, unknown>) {
  const id = crypto.randomUUID();
  const now = new Date();
  const robot: DevRobot = {
    id,
    ownerId: owner.id,
    slug: `${slugify(String(data.name))}-${id.slice(0, 8)}`,
    name: String(data.name),
    category: String(data.category),
    description: String(data.description),
    capabilities: data.capabilities as string[],
    photos: data.photos as string[],
    videoUrl: (data.videoUrl as string | null | undefined) ?? null,
    manufacturer: (data.manufacturer as string | null | undefined) ?? null,
    modelNumber: (data.modelNumber as string | null | undefined) ?? null,
    yearManufactured: (data.yearManufactured as number | null | undefined) ?? null,
    weightKg: (data.weightKg as number | null | undefined) ?? null,
    batteryLifeHours: (data.batteryLifeHours as number | null | undefined) ?? null,
    operatingRadius: (data.operatingRadius as number | null | undefined) ?? null,
    requiresOperator: Boolean(data.requiresOperator),
    pricePerHour: Number(data.pricePerHour),
    pricePerDay: Number(data.pricePerDay),
    depositAmount: Number(data.depositAmount),
    currency: String(data.currency ?? "USD"),
    minRentalHours: Number(data.minRentalHours ?? 1),
    maxRentalHours: (data.maxRentalHours as number | null | undefined) ?? null,
    cancellationPolicy: (data.cancellationPolicy as "FLEXIBLE" | "MODERATE" | "STRICT" | undefined) ?? "MODERATE",
    availabilityZone: String(data.availabilityZone),
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
    isAvailable: data.isAvailable === undefined ? true : Boolean(data.isAvailable),
    isVerified: false,
    safetyRating: null,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
    owner,
  };

  robots().set(robot.id, robot);

  return robot;
}

export function updateDevRobot(id: string, data: Record<string, unknown>) {
  const robot = findDevRobot(id);

  if (!robot) {
    return null;
  }

  const updated = {
    ...robot,
    ...data,
    updatedAt: new Date(),
  } as DevRobot;

  robots().set(robot.id, updated);

  return updated;
}

export function publishDevRobot(id: string) {
  const robot = findDevRobot(id);

  if (!robot) {
    return null;
  }

  robot.status = "ACTIVE";
  robot.isAvailable = true;
  robot.isVerified = true;
  robot.safetyRating = robot.safetyRating ?? 4.6;
  robot.updatedAt = new Date();
  robots().set(robot.id, robot);

  return robot;
}

export function createDevBooking(input: {
  clientId: string;
  clientName: string;
  robotId: string;
  taskDescription: string;
  requestedStart: Date;
  requestedEnd: Date;
  deliveryAddress: string;
  deliveryLatitude: number;
  deliveryLongitude: number;
}) {
  const robot = findDevRobot(input.robotId);

  if (!robot || robot.status !== "ACTIVE" || !robot.isAvailable) {
    return { error: "Robot is not available for booking" as const };
  }

  const totalHours = differenceInMinutes(input.requestedEnd, input.requestedStart) / 60;

  if (totalHours < robot.minRentalHours) {
    return { error: "Requested duration is too short" as const };
  }

  const subtotal = totalHours * robot.pricePerHour;
  const fees = calculateBookingFees(subtotal, robot.depositAmount);
  const id = crypto.randomUUID();
  const now = new Date();
  const booking: DevBooking = {
    id,
    clientId: input.clientId,
    clientName: input.clientName,
    ownerId: robot.ownerId,
    robotId: robot.id,
    robotName: robot.name,
    taskDescription: input.taskDescription,
    requestedStart: input.requestedStart,
    requestedEnd: input.requestedEnd,
    confirmedStart: null,
    confirmedEnd: null,
    expiresAt: addHours(now, 24),
    deliveryAddress: input.deliveryAddress,
    deliveryLatitude: input.deliveryLatitude,
    deliveryLongitude: input.deliveryLongitude,
    status: "PENDING",
    totalHours,
    subtotal,
    clientServiceFee: fees.clientServiceFee,
    ownerServiceFee: fees.ownerServiceFee,
    depositAmount: robot.depositAmount,
    ownerPayout: fees.ownerPayout,
    currency: robot.currency,
    safetyAcknowledged: true,
    rejectionReason: null,
    ownerNotes: null,
    createdAt: now,
    updatedAt: now,
  };

  bookings().set(id, booking);

  return { booking };
}

export function listDevBookings(options: { ownerId?: string; clientId?: string }) {
  return Array.from(bookings().values())
    .filter((booking) => {
      if (options.ownerId) {
        return booking.ownerId === options.ownerId;
      }

      if (options.clientId) {
        return booking.clientId === options.clientId;
      }

      return true;
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export function decideDevBooking(id: string, ownerId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const booking = bookings().get(id);

  if (!booking || booking.ownerId !== ownerId || booking.status !== "PENDING") {
    return null;
  }

  booking.status = decision;
  booking.confirmedStart = decision === "APPROVED" ? booking.requestedStart : null;
  booking.confirmedEnd = decision === "APPROVED" ? booking.requestedEnd : null;
  booking.rejectionReason = decision === "REJECTED" ? reason ?? "Owner declined the request" : null;
  booking.updatedAt = new Date();
  bookings().set(id, booking);

  return booking;
}
