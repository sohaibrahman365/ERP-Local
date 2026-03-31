import { Router, Request, Response, NextFunction } from "express";
import { createProductSchema, updateProductSchema, createCategorySchema, stockAdjustmentSchema, paginationSchema } from "@wise/shared";
import { prisma } from "../lib/prisma";
import { sendSuccess, sendPaginated, sendError } from "../lib/response";
import { authenticate, requirePermission } from "../middleware/auth";
import { validate } from "../middleware/validate";

export const productRouter = Router();

// Categories
productRouter.get("/categories", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.category.findMany({
      where: { tenantId: req.user!.tenantId },
      orderBy: { sortOrder: "asc" },
    });
    sendSuccess(res, categories);
  } catch (err) { next(err); }
});

productRouter.post("/categories", authenticate, requirePermission("inventory:write:all"), validate(createCategorySchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const category = await prisma.category.create({
      data: { tenantId: req.user!.tenantId, ...req.body },
    });
    sendSuccess(res, category, 201);
  } catch (err) { next(err); }
});

// Products CRUD
productRouter.get("/", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, pageSize, sortBy, sortOrder, search } = paginationSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { where: { isPrimary: true }, take: 1 } },
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    sendPaginated(res, products, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

productRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
      include: { category: true, variants: true, images: { orderBy: { sortOrder: "asc" } }, inventoryStock: { include: { location: true } } },
    });
    if (!product) { sendError(res, "Product not found", 404); return; }
    sendSuccess(res, product);
  } catch (err) { next(err); }
});

productRouter.post("/", authenticate, requirePermission("inventory:write:all"), validate(createProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const slug = req.body.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const product = await prisma.product.create({
      data: { tenantId: req.user!.tenantId, slug, ...req.body },
    });
    sendSuccess(res, product, 201);
  } catch (err) { next(err); }
});

productRouter.patch("/:id", authenticate, requirePermission("inventory:write:all"), validate(updateProductSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    sendSuccess(res, product);
  } catch (err) { next(err); }
});

productRouter.delete("/:id", authenticate, requirePermission("inventory:delete:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isDeleted: true },
    });
    sendSuccess(res, { message: "Product deleted" });
  } catch (err) { next(err); }
});

// Stock
productRouter.get("/:id/stock", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stock = await prisma.inventoryStock.findMany({
      where: { productId: req.params.id, tenantId: req.user!.tenantId },
      include: { location: true, variant: true },
    });
    sendSuccess(res, stock);
  } catch (err) { next(err); }
});

productRouter.post("/stock/adjust", authenticate, requirePermission("inventory:write:all"), validate(stockAdjustmentSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, variantId, locationId, type, quantity, notes, costPerUnit } = req.body;

    await prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          tenantId: req.user!.tenantId,
          productId, variantId, locationId, type, quantity, notes, costPerUnit,
          createdBy: req.user!.userId,
        },
      });

      const isInbound = ["PURCHASE_IN", "TRANSFER_IN", "RETURN_IN", "ADJUSTMENT"].includes(type);
      const delta = isInbound ? quantity : -quantity;

      await tx.inventoryStock.upsert({
        where: {
          tenantId_productId_variantId_locationId: {
            tenantId: req.user!.tenantId,
            productId,
            variantId: variantId ?? "",
            locationId,
          },
        },
        update: { qtyOnHand: { increment: delta } },
        create: {
          tenantId: req.user!.tenantId,
          productId, variantId, locationId,
          qtyOnHand: Math.max(0, delta),
        },
      });
    });

    sendSuccess(res, { message: "Stock adjusted" });
  } catch (err) { next(err); }
});
