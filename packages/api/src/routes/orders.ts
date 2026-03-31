import { Router, Request, Response, NextFunction } from "express";
import { createOrderSchema, updateOrderStatusSchema, paginationSchema } from "@wise/shared";
import { generateSequentialNumber } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const orderRouter = Router();

orderRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, sortBy, sortOrder, search } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    if (req.query.status) where.status = req.query.status;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { customer: true, items: true },
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    sendPaginated(res, orders, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

orderRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId },
      include: { customer: true, items: { include: { product: true } }, shipments: true },
    });
    if (!order) { sendError(res, "Order not found", 404); return; }
    sendSuccess(res, order);
  } catch (err) { next(err); }
});

orderRouter.post("/", authenticate, requirePermission("orders:write:all"), validate(createOrderSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { customerId, channel, items, paymentMethod, shippingAddrId, billingAddrId, couponCode, notes } = req.body;

    const orderCount = await prisma.order.count({ where: { tenantId: req.user!.tenantId } });
    const orderNumber = generateSequentialNumber("ORD", orderCount + 1);

    let subtotal = 0;
    let taxAmount = 0;
    const orderItems = items.map((item: { productId: string; variantId?: string; quantity: number; unitPrice: number; discountAmount?: number; locationId?: string; notes?: string }) => {
      const itemTotal = item.unitPrice * item.quantity - (item.discountAmount ?? 0);
      const itemTax = itemTotal * 0.17; // 17% GST
      subtotal += itemTotal;
      taxAmount += itemTax;
      return {
        tenantId: req.user!.tenantId,
        productId: item.productId,
        variantId: item.variantId,
        productName: "",
        sku: "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountAmount: item.discountAmount ?? 0,
        taxAmount: itemTax,
        totalAmount: itemTotal + itemTax,
        locationId: item.locationId,
        notes: item.notes,
      };
    });

    const totalAmount = subtotal + taxAmount;

    const order = await prisma.order.create({
      data: {
        tenantId: req.user!.tenantId,
        orderNumber,
        customerId,
        channel,
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod,
        shippingAddrId,
        billingAddrId,
        couponCode,
        notes,
        status: "PENDING_PAYMENT",
        placedAt: new Date(),
        items: { create: orderItems },
      },
      include: { items: true },
    });

    sendSuccess(res, order, 201);
  } catch (err) { next(err); }
});

orderRouter.patch("/:id/status", authenticate, requirePermission("orders:write:all"), validate(updateOrderStatusSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, internalNotes, cancellationReason } = req.body;
    const updateData: Record<string, unknown> = { status };

    if (status === "CONFIRMED") updateData.confirmedAt = new Date();
    if (status === "SHIPPED") updateData.shippedAt = new Date();
    if (status === "DELIVERED") updateData.deliveredAt = new Date();
    if (status === "CANCELLED") {
      updateData.cancelledAt = new Date();
      updateData.cancellationReason = cancellationReason;
    }
    if (internalNotes) updateData.internalNotes = internalNotes;

    const order = await prisma.order.update({
      where: { id: req.params.id },
      data: updateData,
    });

    sendSuccess(res, order);
  } catch (err) { next(err); }
});
