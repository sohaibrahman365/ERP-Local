import { z } from "zod";

export const createVehicleSchema = z.object({
  listingType: z.enum(["INDIVIDUAL", "DEALER"]),
  condition: z.enum([
    "NEW",
    "CERTIFIED_PREOWNED",
    "USED_EXCELLENT",
    "USED_GOOD",
    "USED_FAIR",
    "SALVAGE",
  ]),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  variantName: z.string().optional(),
  year: z.number().int().min(1900).max(2030),
  mileageKm: z.number().int().min(0).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC", "CNG", "LPG"]).optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL", "CVT", "DCT"]).optional(),
  engineCc: z.number().int().positive().optional(),
  bodyType: z
    .enum(["SEDAN", "SUV", "HATCHBACK", "CROSSOVER", "TRUCK", "VAN", "COUPE", "WAGON", "BUS"])
    .optional(),
  color: z.string().optional(),
  registrationCity: z.string().optional(),
  registrationYear: z.number().int().optional(),
  numOwners: z.number().int().min(1).default(1),
  vin: z.string().optional(),
  price: z.number().positive(),
  priceNegotiable: z.boolean().default(true),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  city: z.string().min(1),
  area: z.string().optional(),
});

export const updateVehicleSchema = createVehicleSchema.partial();

export const createInspectionSchema = z.object({
  vehicleId: z.string().uuid(),
  inspectionDate: z.coerce.date().optional(),
  locationType: z.string().optional(),
  locationAddr: z.string().optional(),
  feeAmount: z.number().min(2500).default(2500),
});

export const completeInspectionSchema = z.object({
  overallScore: z.number().min(1).max(5),
  checklist: z.record(z.string(), z.unknown()),
  summary: z.string(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type CreateInspectionInput = z.infer<typeof createInspectionSchema>;
