import { z } from "zod";

export const createCustomerSchema = z.object({
  type: z.enum(["INDIVIDUAL", "BUSINESS", "DEALER"]).default("INDIVIDUAL"),
  fullName: z.string().min(2).max(100),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(20),
  whatsapp: z.string().optional(),
  cnic: z.string().optional(),
  companyName: z.string().optional(),
  ntn: z.string().optional(),
  segment: z.enum(["NEW", "RETURNING", "VIP", "WHOLESALE", "OVERSEAS"]).default("NEW"),
  source: z.string().optional(),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  currency: z.string().default("PKR"),
});

export const updateCustomerSchema = createCustomerSchema.partial();

export const createAddressSchema = z.object({
  customerId: z.string().uuid(),
  label: z.string().optional(),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().optional(),
  city: z.string().min(2).max(100),
  stateProvince: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().default("PK"),
  phone: z.string().optional(),
  isDefault: z.boolean().default(false),
});

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
