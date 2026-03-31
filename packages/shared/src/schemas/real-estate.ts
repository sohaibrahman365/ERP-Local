import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  description: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  totalTowers: z.number().int().positive().optional(),
  totalFloors: z.number().int().positive().optional(),
  totalUnits: z.number().int().positive().optional(),
  projectType: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED_USE"]),
  status: z
    .enum([
      "PRE_LAUNCH",
      "LAUNCHED",
      "UNDER_CONSTRUCTION",
      "NEAR_COMPLETION",
      "COMPLETED",
      "HANDOVER",
    ])
    .default("PRE_LAUNCH"),
  launchDate: z.coerce.date().optional(),
  expectedCompletion: z.coerce.date().optional(),
  amenities: z.array(z.string()).default([]),
});

export const createUnitSchema = z.object({
  projectId: z.string().uuid(),
  towerBlock: z.string().optional(),
  floorNumber: z.number().int().min(0),
  unitNumber: z.string().min(1),
  unitType: z.enum([
    "APT_1BED",
    "APT_2BED",
    "APT_3BED",
    "PENTHOUSE",
    "STUDIO",
    "SHOP_SMALL",
    "SHOP_MEDIUM",
    "SHOP_LARGE",
    "SHOWROOM",
    "OFFICE",
    "PARKING",
  ]),
  carpetAreaSqft: z.number().positive().optional(),
  coveredAreaSqft: z.number().positive().optional(),
  facing: z.string().optional(),
  baseRatePerSqft: z.number().positive().optional(),
  floorPremiumPct: z.number().min(0).default(0),
  cornerPremiumPct: z.number().min(0).default(0),
  totalPrice: z.number().positive(),
  features: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const createBookingSchema = z.object({
  unitId: z.string().uuid(),
  customerId: z.string().uuid(),
  agentId: z.string().uuid().optional(),
  dealerId: z.string().uuid().optional(),
  bookingDate: z.coerce.date(),
  totalAmount: z.number().positive(),
  downPayment: z.number().positive(),
  installmentPlanId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const createInstallmentPlanSchema = z.object({
  name: z.string().min(2).max(100),
  projectId: z.string().uuid().optional(),
  downPaymentPct: z.number().min(0).max(100),
  numInstallments: z.number().int().positive(),
  frequency: z.enum(["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]),
  possessionPaymentPct: z.number().min(0).max(100).default(0),
  notes: z.string().optional(),
});

export const recordInstallmentPaymentSchema = z.object({
  amountPaid: z.number().positive(),
  paymentMethod: z.string(),
  paymentRef: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CreateInstallmentPlanInput = z.infer<typeof createInstallmentPlanSchema>;
