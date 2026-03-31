import { z } from "zod";

export const checkInSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  locationId: z.string().uuid().optional(),
  notes: z.string().optional(),
});

export const checkOutSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  notes: z.string().optional(),
});

export const createLeaveRequestSchema = z.object({
  leaveType: z.enum([
    "ANNUAL",
    "CASUAL",
    "SICK",
    "MATERNITY",
    "PATERNITY",
    "UNPAID",
    "BEREAVEMENT",
    "HAJJ",
  ]),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  totalDays: z.number().positive(),
  reason: z.string().optional(),
});

export const approveLeaveSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  rejectionReason: z.string().optional(),
});

export const createPayrollRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2030),
});

export const updateEmployeeProfileSchema = z.object({
  employmentType: z
    .enum(["PERMANENT", "CONTRACT", "PROBATION", "INTERN", "FREELANCE"])
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  maritalStatus: z.enum(["SINGLE", "MARRIED", "WIDOWED", "DIVORCED"]).optional(),
  bloodGroup: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccountNo: z.string().optional(),
  bankIban: z.string().optional(),
  eobiNumber: z.string().optional(),
  taxNtn: z.string().optional(),
  basicSalary: z.number().positive().optional(),
  hra: z.number().min(0).optional(),
  medicalAllow: z.number().min(0).optional(),
  conveyanceAllow: z.number().min(0).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
export type CreateLeaveRequestInput = z.infer<typeof createLeaveRequestSchema>;
export type CreatePayrollRunInput = z.infer<typeof createPayrollRunSchema>;
