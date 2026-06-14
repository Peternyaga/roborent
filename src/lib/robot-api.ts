import { z } from "zod";

export const robotSchema = z.object({
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
  videoUrl: z.string().url().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  modelNumber: z.string().optional().nullable(),
  yearManufactured: z.number().int().min(1950).max(2100).optional().nullable(),
  weightKg: z.number().positive().optional().nullable(),
  batteryLifeHours: z.number().positive().optional().nullable(),
  operatingRadius: z.number().positive().optional().nullable(),
  pricePerHour: z.number().positive(),
  pricePerDay: z.number().positive(),
  depositAmount: z.number().min(0),
  currency: z.string().length(3).default("USD"),
  minRentalHours: z.number().int().positive().default(1),
  maxRentalHours: z.number().int().positive().optional().nullable(),
  cancellationPolicy: z.enum(["FLEXIBLE", "MODERATE", "STRICT"]).default("MODERATE"),
  availabilityZone: z.string().min(2),
  latitude: z.number(),
  longitude: z.number(),
  requiresOperator: z.boolean().default(false),
  isAvailable: z.boolean().default(true),
});

export const updateRobotSchema = robotSchema.partial().extend({
  capabilities: z.array(z.string()).min(1).optional(),
  photos: z.array(z.string().url()).min(1).optional(),
});

export function serializeRobot(robot: {
  pricePerHour: unknown;
  pricePerDay: unknown;
  depositAmount: unknown;
  latitude: unknown;
  longitude: unknown;
  weightKg: unknown;
  batteryLifeHours: unknown;
  operatingRadius: unknown;
  safetyRating: unknown;
}) {
  return {
    ...robot,
    pricePerHour: Number(robot.pricePerHour),
    pricePerDay: Number(robot.pricePerDay),
    depositAmount: Number(robot.depositAmount),
    latitude: Number(robot.latitude),
    longitude: Number(robot.longitude),
    weightKg: robot.weightKg === null ? null : Number(robot.weightKg),
    batteryLifeHours:
      robot.batteryLifeHours === null ? null : Number(robot.batteryLifeHours),
    operatingRadius:
      robot.operatingRadius === null ? null : Number(robot.operatingRadius),
    safetyRating: robot.safetyRating === null ? null : Number(robot.safetyRating),
  };
}
