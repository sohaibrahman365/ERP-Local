import { z } from "zod";

export const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  channel: z.enum(["WEBSITE", "WHATSAPP", "PHONE", "WALKIN", "MARKETPLACE"]),
  paymentMethod: z.string().optional(),
  shippingAddrId: z.string().uuid().optional(),
  billingAddrId: z.string().uuid().optional(),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        variantId: z.string().uuid().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().positive(),
        discountAmount: z.number().min(0).default(0),
        locationId: z.string().uuid().optional(),
        notes: z.string().optional(),
      })
    )
    .min(1),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum([
    "DRAFT",
    "PENDING_PAYMENT",
    "CONFIRMED",
    "PROCESSING",
    "PACKED",
    "SHIPPED",
    "OUT_FOR_DELIVERY",
    "DELIVERED",
    "RETURN_REQUESTED",
    "RETURNED",
    "REFUNDED",
    "CANCELLED",
    "ON_HOLD",
  ]),
  internalNotes: z.string().optional(),
  cancellationReason: z.string().optional(),
});

export const createShipmentSchema = z.object({
  orderId: z.string().uuid(),
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  weightKg: z.number().positive().optional(),
  shippingCost: z.number().min(0).optional(),
  codAmount: z.number().min(0).optional(),
  estimatedDelivery: z.coerce.date().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
