-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('INVENTORY', 'SERVICE', 'RAW_MATERIAL', 'CONSUMABLE', 'BUNDLE');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "conversionFactor" DECIMAL(10,4),
ADD COLUMN     "hsnCode" TEXT,
ADD COLUMN     "inventoryAccountId" TEXT,
ADD COLUMN     "isPurchasable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isSellable" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isTrackInventory" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "itemType" "ItemType" NOT NULL DEFAULT 'INVENTORY',
ADD COLUMN     "leadTimeDays" INTEGER,
ADD COLUMN     "maxOrderQty" DECIMAL(10,2),
ADD COLUMN     "minOrderQty" DECIMAL(10,2),
ADD COLUMN     "purchaseAccountId" TEXT,
ADD COLUMN     "purchaseUom" TEXT,
ADD COLUMN     "reorderPoint" INTEGER,
ADD COLUMN     "reorderQty" INTEGER,
ADD COLUMN     "salesAccountId" TEXT,
ADD COLUMN     "uom" TEXT NOT NULL DEFAULT 'PCS';

-- CreateTable
CREATE TABLE "bundle_items" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bundle_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bundle_items_tenantId_bundleId_componentId_key" ON "bundle_items"("tenantId", "bundleId", "componentId");

-- CreateIndex
CREATE INDEX "products_tenantId_itemType_status_idx" ON "products"("tenantId", "itemType", "status");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_salesAccountId_fkey" FOREIGN KEY ("salesAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_purchaseAccountId_fkey" FOREIGN KEY ("purchaseAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "chart_of_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bundle_items" ADD CONSTRAINT "bundle_items_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
