import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerTenantSchema = z.object({
  tenantName: z.string().min(2).max(100),
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6),
  newPassword: z.string().min(8).max(128),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(8).max(128),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(100),
  password: z.string().min(8).max(128),
  phone: z.string().optional(),
  roleId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  locationId: z.string().uuid().optional(),
  designation: z.string().optional(),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  slug: z.string().min(2).max(50),
  permissions: z.array(z.string()),
  description: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterTenantInput = z.infer<typeof registerTenantSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
