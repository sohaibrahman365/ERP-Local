import { z } from "zod";
import { paginationSchema } from "./common";

// ---------------------------------------------------------------------------
// Enums & Constants
// ---------------------------------------------------------------------------

export const itemTypeEnum = z.enum([
  "INVENTORY",
  "SERVICE",
  "RAW_MATERIAL",
  "CONSUMABLE",
  "BUNDLE",
]);
export type ItemType = z.infer<typeof itemTypeEnum>;

export const uomOptions = [
  "PCS", "KG", "GM", "LTR", "ML", "MTR", "CM",
  "SQM", "SQFT", "HR", "MIN", "SET", "BOX",
  "CARTON", "PAIR", "DOZEN", "UNIT",
] as const;
export const uomEnum = z.enum(uomOptions);

export const productStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED", "OUT_OF_STOCK"]);

// ---------------------------------------------------------------------------
// Create / Update Product (Item Master)
// ---------------------------------------------------------------------------

const baseProductSchema = z.object({
  name: z.string().min(2).max(200),
  sku: z.string().min(1).max(50),
  barcode: z.string().optional(),
  itemType: itemTypeEnum.default("INVENTORY"),
  uom: uomEnum.default("PCS"),
  purchaseUom: uomEnum.optional(),
  conversionFactor: z.number().positive().optional(),
  hsnCode: z.string().max(20).optional(),
  categoryId: z.string().uuid(),
  brand: z.string().optional(),
  shortDesc: z.string().max(500).optional(),
  longDesc: z.string().optional(),
  basePrice: z.number().positive(),
  costPrice: z.number().positive().optional(),
  compareAtPrice: z.number().positive().optional(),
  taxRatePct: z.number().min(0).max(100).default(0),
  taxInclusive: z.boolean().default(true),
  weightKg: z.number().positive().optional(),
  dimensions: z
    .object({
      length: z.number().optional(),
      width: z.number().optional(),
      height: z.number().optional(),
    })
    .optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  status: productStatusEnum.default("DRAFT"),
  isFeatured: z.boolean().default(false),
  isRefurbished: z.boolean().default(false),
  refurbishGrade: z.string().optional(),
  warrantyMonths: z.number().int().min(0).default(0),
  isTrackInventory: z.boolean().default(true),
  isPurchasable: z.boolean().default(true),
  isSellable: z.boolean().default(true),
  reorderPoint: z.number().int().min(0).optional(),
  reorderQty: z.number().int().min(0).optional(),
  leadTimeDays: z.number().int().min(0).optional(),
  salesAccountId: z.string().uuid().optional(),
  purchaseAccountId: z.string().uuid().optional(),
  inventoryAccountId: z.string().uuid().optional(),
  minOrderQty: z.number().positive().optional(),
  maxOrderQty: z.number().positive().optional(),
});

export const createProductSchema = baseProductSchema;
export const updateProductSchema = baseProductSchema.partial();

// ---------------------------------------------------------------------------
// Variants
// ---------------------------------------------------------------------------

export const createVariantSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string().min(1).max(50),
  name: z.string().optional(),
  priceOverride: z.number().positive().optional(),
  costOverride: z.number().positive().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  barcode: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  parentId: z.string().uuid().optional(),
  vertical: z.enum(["ECOMMERCE", "AUTOMOTIVE", "REALESTATE"]),
  icon: z.string().optional(),
  sortOrder: z.number().int().default(0),
  seoTitle: z.string().optional(),
  seoDesc: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Stock
// ---------------------------------------------------------------------------

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  locationId: z.string().uuid(),
  type: z.enum([
    "PURCHASE_IN",
    "SALE_OUT",
    "TRANSFER_IN",
    "TRANSFER_OUT",
    "ADJUSTMENT",
    "RETURN_IN",
    "DAMAGE_OUT",
  ]),
  quantity: z.number().int(),
  notes: z.string().optional(),
  costPerUnit: z.number().positive().optional(),
});

// ---------------------------------------------------------------------------
// Bundle Items
// ---------------------------------------------------------------------------

export const bundleItemSchema = z.object({
  componentId: z.string().uuid(),
  quantity: z.number().positive(),
  sortOrder: z.number().int().default(0),
});

export const bundleItemsSchema = z.object({
  items: z.array(bundleItemSchema).min(1),
});

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

export const productListFilterSchema = paginationSchema.extend({
  itemType: itemTypeEnum.optional(),
  categoryId: z.string().uuid().optional(),
  status: productStatusEnum.optional(),
  isPurchasable: z.coerce.boolean().optional(),
  isSellable: z.coerce.boolean().optional(),
});

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;
export type BundleItemInput = z.infer<typeof bundleItemSchema>;
export type ProductListFilterInput = z.infer<typeof productListFilterSchema>;
