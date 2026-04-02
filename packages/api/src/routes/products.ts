import { Router, Request, Response, NextFunction } from "express";
import { createProductSchema, updateProductSchema, createCategorySchema, stockAdjustmentSchema, productListFilterSchema, bundleItemsSchema } from "@wise/shared";
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
    const { page, pageSize, sortBy, sortOrder, search, itemType, categoryId, status, isPurchasable, isSellable } = productListFilterSchema.parse(req.query);
    const where: Record<string, unknown> = { tenantId: req.user!.tenantId, isDeleted: false };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
      ];
    }

    if (itemType) {
      where.itemType = itemType;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (isPurchasable !== undefined) {
      where.isPurchasable = isPurchasable;
    }

    if (isSellable !== undefined) {
      where.isSellable = isSellable;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          tenantId: true,
          name: true,
          slug: true,
          sku: true,
          barcode: true,
          itemType: true,
          uom: true,
          basePrice: true,
          costPrice: true,
          compareAtPrice: true,
          status: true,
          isFeatured: true,
          isPurchasable: true,
          isSellable: true,
          isTrackInventory: true,
          createdAt: true,
          updatedAt: true,
          category: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
        orderBy: { [sortBy ?? "createdAt"]: sortOrder },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    sendPaginated(res, products, { page, pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (err) { next(err); }
});

// SKU availability check (must be before /:id to avoid route conflicts)
productRouter.get("/sku-check", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sku = req.query.sku as string;
    if (!sku) {
      sendError(res, "Query parameter 'sku' is required", 400);
      return;
    }

    const existing = await prisma.product.findFirst({
      where: { sku, tenantId: req.user!.tenantId, isDeleted: false },
      select: { id: true },
    });

    sendSuccess(res, {
      available: !existing,
      ...(existing ? { existingProductId: existing.id } : {}),
    });
  } catch (err) { next(err); }
});

productRouter.get("/:id", authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
      include: {
        category: true,
        variants: true,
        images: { orderBy: { sortOrder: "asc" } },
        inventoryStock: { include: { location: true } },
        bundleItems: {
          include: {
            component: {
              select: { id: true, name: true, sku: true, uom: true, basePrice: true },
            },
          },
          orderBy: { sortOrder: "asc" },
        },
      },
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

// Bundle Items
productRouter.post("/:id/bundle-items", authenticate, requirePermission("inventory:write:all"), validate(bundleItemsSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, tenantId: req.user!.tenantId, isDeleted: false },
      select: { id: true, itemType: true },
    });

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    if (product.itemType !== "BUNDLE") {
      sendError(res, "Only products with itemType BUNDLE can have bundle items", 400);
      return;
    }

    const { items } = req.body;

    const bundleItems = await prisma.$transaction(async (tx) => {
      // Delete existing bundle items (replace strategy)
      await tx.bundleItem.deleteMany({
        where: { bundleId: req.params.id, tenantId: req.user!.tenantId },
      });

      // Create new bundle items
      await tx.bundleItem.createMany({
        data: items.map((item: { componentId: string; quantity: number; sortOrder: number }) => ({
          tenantId: req.user!.tenantId,
          bundleId: req.params.id,
          componentId: item.componentId,
          quantity: item.quantity,
          sortOrder: item.sortOrder ?? 0,
        })),
      });

      // Return the newly created bundle items with component details
      return tx.bundleItem.findMany({
        where: { bundleId: req.params.id, tenantId: req.user!.tenantId },
        include: {
          component: {
            select: { id: true, name: true, sku: true, uom: true, basePrice: true },
          },
        },
        orderBy: { sortOrder: "asc" },
      });
    });

    sendSuccess(res, bundleItems);
  } catch (err) { next(err); }
});

productRouter.delete("/:id/bundle-items/:componentId", authenticate, requirePermission("inventory:write:all"), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deleted = await prisma.bundleItem.deleteMany({
      where: {
        bundleId: req.params.id,
        componentId: req.params.componentId,
        tenantId: req.user!.tenantId,
      },
    });

    if (deleted.count === 0) {
      sendError(res, "Bundle item not found", 404);
      return;
    }

    sendSuccess(res, { message: "Bundle item removed" });
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

    // Guard: only allow stock adjustment for products that track inventory
    const product = await prisma.product.findFirst({
      where: { id: productId, tenantId: req.user!.tenantId, isDeleted: false },
      select: { id: true, isTrackInventory: true },
    });

    if (!product) {
      sendError(res, "Product not found", 404);
      return;
    }

    if (!product.isTrackInventory) {
      sendError(res, "Stock adjustment is not allowed for products that do not track inventory", 400);
      return;
    }

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
