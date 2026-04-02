import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: "wisemarket" },
    update: {},
    create: {
      name: "WiseMarket",
      slug: "wisemarket",
      plan: "ENTERPRISE",
      status: "ACTIVE",
      billingEmail: "billing@wisemarket.com.pk",
      maxUsers: 100,
      maxStorageGb: 50,
    },
  });

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "super-admin" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Super Admin",
      slug: "super-admin",
      permissions: ["*:*:all"],
      isSystem: true,
    },
  });

  const salesRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "sales-agent" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Sales Agent",
      slug: "sales-agent",
      permissions: ["orders:read:all", "orders:write:all", "customers:read:all", "customers:write:all", "products:read:all", "inventory:read:all"],
    },
  });

  const financeRole = await prisma.role.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: "finance-manager" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Finance Manager",
      slug: "finance-manager",
      permissions: ["finance:read:all", "finance:write:all", "finance:approve:all"],
    },
  });

  // Create departments
  const salesDept = await prisma.department.create({
    data: { tenantId: tenant.id, name: "Sales", code: "SALES" },
  });

  const financeDept = await prisma.department.create({
    data: { tenantId: tenant.id, name: "Finance", code: "FIN" },
  });

  const hrDept = await prisma.department.create({
    data: { tenantId: tenant.id, name: "Human Resources", code: "HR" },
  });

  // Create location
  const mainOffice = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: "Head Office Lahore",
      type: "OFFICE",
      city: "Lahore",
      country: "PK",
      latitude: 31.5204,
      longitude: 74.3587,
      geoFenceRadiusM: 200,
    },
  });

  const warehouse = await prisma.location.create({
    data: {
      tenantId: tenant.id,
      name: "Main Warehouse",
      type: "WAREHOUSE",
      city: "Lahore",
      country: "PK",
    },
  });

  // Create users
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  const adminUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@wisemarket.com.pk" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@wisemarket.com.pk",
      passwordHash,
      fullName: "Admin User",
      phone: "+923001234567",
      roleId: adminRole.id,
      locationId: mainOffice.id,
      designation: "CEO",
      status: "ACTIVE",
    },
  });

  const salesUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "sales@wisemarket.com.pk" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "sales@wisemarket.com.pk",
      passwordHash: await bcrypt.hash("Sales@123", 12),
      fullName: "Sales Agent",
      phone: "+923002345678",
      roleId: salesRole.id,
      departmentId: salesDept.id,
      locationId: mainOffice.id,
      designation: "Sales Executive",
      status: "ACTIVE",
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "finance@wisemarket.com.pk" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "finance@wisemarket.com.pk",
      passwordHash: await bcrypt.hash("Finance@123", 12),
      fullName: "Finance Manager",
      phone: "+923003456789",
      roleId: financeRole.id,
      departmentId: financeDept.id,
      locationId: mainOffice.id,
      designation: "Finance Manager",
      status: "ACTIVE",
    },
  });

  // Create categories
  const electronics = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Electronics", slug: "electronics", vertical: "ECOMMERCE" },
  });

  const fashion = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Fashion", slug: "fashion", vertical: "ECOMMERCE" },
  });

  const mobiles = await prisma.category.create({
    data: { tenantId: tenant.id, name: "Mobile Phones", slug: "mobile-phones", vertical: "ECOMMERCE", parentId: electronics.id },
  });

  // Create products
  const product1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Samsung Galaxy S24 Ultra",
      slug: "samsung-galaxy-s24-ultra",
      sku: "SAM-S24U-256",
      categoryId: mobiles.id,
      brand: "Samsung",
      shortDesc: "Latest flagship with AI features",
      basePrice: 389999,
      costPrice: 350000,
      taxRatePct: 17,
      status: "ACTIVE",
      isFeatured: true,
      warrantyMonths: 12,
      publishedAt: new Date(),
    },
  });

  const product2 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "iPhone 15 Pro Max",
      slug: "iphone-15-pro-max",
      sku: "APL-15PM-256",
      categoryId: mobiles.id,
      brand: "Apple",
      shortDesc: "Titanium design with A17 Pro chip",
      basePrice: 549999,
      costPrice: 500000,
      taxRatePct: 17,
      status: "ACTIVE",
      isFeatured: true,
      warrantyMonths: 12,
      publishedAt: new Date(),
    },
  });

  // Create stock
  await prisma.inventoryStock.create({
    data: { tenantId: tenant.id, productId: product1.id, locationId: warehouse.id, qtyOnHand: 50 },
  });

  await prisma.inventoryStock.create({
    data: { tenantId: tenant.id, productId: product2.id, locationId: warehouse.id, qtyOnHand: 30 },
  });

  // Sample SERVICE item
  const service1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Phone Screen Repair",
      slug: "phone-screen-repair",
      sku: "SVC-SCR-RPR",
      categoryId: mobiles.id,
      itemType: "SERVICE",
      uom: "PCS",
      isTrackInventory: false,
      basePrice: 5000,
      costPrice: 2000,
      taxRatePct: 17,
      status: "ACTIVE",
      shortDesc: "Professional screen replacement service",
    },
  });

  // Sample RAW_MATERIAL item
  const rawMaterial1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "LCD Display Panel 6.7\"",
      slug: "lcd-display-panel-67",
      sku: "RAW-LCD-67",
      categoryId: mobiles.id,
      itemType: "RAW_MATERIAL",
      uom: "PCS",
      isSellable: false,
      basePrice: 3000,
      costPrice: 2500,
      taxRatePct: 17,
      status: "ACTIVE",
      reorderPoint: 10,
      reorderQty: 50,
      leadTimeDays: 14,
      shortDesc: "OLED display panel for phone repairs",
    },
  });

  await prisma.inventoryStock.create({
    data: { tenantId: tenant.id, productId: rawMaterial1.id, locationId: warehouse.id, qtyOnHand: 100 },
  });

  // Sample CONSUMABLE item
  await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Packaging Box (Medium)",
      slug: "packaging-box-medium",
      sku: "CON-BOX-M",
      categoryId: mobiles.id,
      itemType: "CONSUMABLE",
      uom: "PCS",
      isSellable: false,
      basePrice: 50,
      costPrice: 30,
      taxRatePct: 17,
      status: "ACTIVE",
      reorderPoint: 100,
      reorderQty: 500,
      shortDesc: "Medium shipping box for electronics",
    },
  });

  // Sample BUNDLE item
  const bundle1 = await prisma.product.create({
    data: {
      tenantId: tenant.id,
      name: "Samsung S24 Ultra Complete Package",
      slug: "samsung-s24-ultra-package",
      sku: "BND-S24U-PKG",
      categoryId: mobiles.id,
      itemType: "BUNDLE",
      uom: "SET",
      isTrackInventory: false,
      basePrice: 399999,
      costPrice: 355000,
      taxRatePct: 17,
      status: "ACTIVE",
      isFeatured: true,
      shortDesc: "Phone + screen protector + case bundle",
    },
  });

  // Bundle components
  await prisma.bundleItem.create({
    data: { tenantId: tenant.id, bundleId: bundle1.id, componentId: product1.id, quantity: 1, sortOrder: 1 },
  });

  // Create customer
  const customer = await prisma.customer.create({
    data: {
      tenantId: tenant.id,
      fullName: "Ahmed Khan",
      email: "ahmed@example.com",
      phone: "+923011234567",
      segment: "RETURNING",
      loyaltyTier: "SILVER",
      source: "website",
    },
  });

  await prisma.customerAddress.create({
    data: {
      tenantId: tenant.id,
      customerId: customer.id,
      label: "Home",
      addressLine1: "House 42, Block F, DHA Phase 5",
      city: "Lahore",
      country: "PK",
      postalCode: "54000",
      isDefault: true,
    },
  });

  // Create order
  await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: "ORD-000001",
      customerId: customer.id,
      channel: "WEBSITE",
      subtotal: 389999,
      taxAmount: 66300,
      totalAmount: 456299,
      paymentMethod: "COD",
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      placedAt: new Date(),
      confirmedAt: new Date(),
      items: {
        create: [{
          tenantId: tenant.id,
          productId: product1.id,
          productName: "Samsung Galaxy S24 Ultra",
          sku: "SAM-S24U-256",
          quantity: 1,
          unitPrice: 389999,
          taxAmount: 66300,
          totalAmount: 456299,
        }],
      },
    },
  });

  // Create RE project
  const bahriaSky = await prisma.reProject.create({
    data: {
      tenantId: tenant.id,
      name: "Bahria Sky",
      slug: "bahria-sky",
      description: "Premium high-rise residential and commercial project in Bahria Town Lahore",
      city: "Lahore",
      totalTowers: 2,
      totalFloors: 20,
      totalUnits: 200,
      projectType: "MIXED_USE",
      status: "UNDER_CONSTRUCTION",
      constructionPct: 45,
      amenities: ["Swimming Pool", "Gym", "Rooftop Garden", "Parking", "Security"],
    },
  });

  // Create units
  for (let floor = 1; floor <= 5; floor++) {
    for (let unit = 1; unit <= 4; unit++) {
      await prisma.reUnit.create({
        data: {
          tenantId: tenant.id,
          projectId: bahriaSky.id,
          towerBlock: "A",
          floorNumber: floor,
          unitNumber: `A-${floor}0${unit}`,
          unitType: unit <= 2 ? "APT_2BED" : "APT_3BED",
          coveredAreaSqft: unit <= 2 ? 1200 : 1800,
          totalPrice: unit <= 2 ? 15000000 : 22000000,
          status: floor <= 2 && unit <= 2 ? "BOOKED" : "AVAILABLE",
        },
      });
    }
  }

  // Create installment plan
  await prisma.reInstallmentPlan.create({
    data: {
      tenantId: tenant.id,
      name: "3-Year Monthly Plan",
      projectId: bahriaSky.id,
      downPaymentPct: 20,
      numInstallments: 36,
      frequency: "MONTHLY",
      possessionPaymentPct: 10,
    },
  });

  // Create vehicle listing
  await prisma.vehicle.create({
    data: {
      tenantId: tenant.id,
      sellerId: adminUser.id,
      listingType: "INDIVIDUAL",
      condition: "USED_EXCELLENT",
      make: "Toyota",
      model: "Corolla",
      variantName: "Altis Grande 1.8",
      year: 2022,
      mileageKm: 35000,
      fuelType: "PETROL",
      transmission: "AUTOMATIC",
      engineCc: 1798,
      bodyType: "SEDAN",
      color: "White",
      registrationCity: "Lahore",
      numOwners: 1,
      price: 5500000,
      description: "Excellent condition, single owner, full service history",
      features: ["Sunroof", "Leather Seats", "Navigation", "Cruise Control"],
      city: "Lahore",
      area: "DHA",
      status: "ACTIVE",
      publishedAt: new Date(),
    },
  });

  // Create chart of accounts (Pakistan template)
  const accounts = [
    { code: "1000", name: "Cash & Bank", type: "ASSET" as const, normalBalance: "DEBIT" as const, isHeader: true },
    { code: "1001", name: "Cash in Hand", type: "ASSET" as const, normalBalance: "DEBIT" as const },
    { code: "1002", name: "Bank - HBL", type: "ASSET" as const, normalBalance: "DEBIT" as const },
    { code: "1100", name: "Accounts Receivable", type: "ASSET" as const, normalBalance: "DEBIT" as const },
    { code: "1200", name: "Inventory", type: "ASSET" as const, normalBalance: "DEBIT" as const },
    { code: "2000", name: "Liabilities", type: "LIABILITY" as const, normalBalance: "CREDIT" as const, isHeader: true },
    { code: "2001", name: "Accounts Payable", type: "LIABILITY" as const, normalBalance: "CREDIT" as const },
    { code: "2100", name: "GST Payable", type: "LIABILITY" as const, normalBalance: "CREDIT" as const },
    { code: "2200", name: "WHT Payable", type: "LIABILITY" as const, normalBalance: "CREDIT" as const },
    { code: "3000", name: "Equity", type: "EQUITY" as const, normalBalance: "CREDIT" as const, isHeader: true },
    { code: "3001", name: "Owner's Equity", type: "EQUITY" as const, normalBalance: "CREDIT" as const },
    { code: "3100", name: "Retained Earnings", type: "EQUITY" as const, normalBalance: "CREDIT" as const },
    { code: "4000", name: "Revenue", type: "REVENUE" as const, normalBalance: "CREDIT" as const, isHeader: true },
    { code: "4001", name: "Product Sales", type: "REVENUE" as const, normalBalance: "CREDIT" as const },
    { code: "4002", name: "Service Revenue", type: "REVENUE" as const, normalBalance: "CREDIT" as const },
    { code: "4003", name: "RE Revenue", type: "REVENUE" as const, normalBalance: "CREDIT" as const },
    { code: "5000", name: "Cost of Goods Sold", type: "COGS" as const, normalBalance: "DEBIT" as const, isHeader: true },
    { code: "5001", name: "Product COGS", type: "COGS" as const, normalBalance: "DEBIT" as const },
    { code: "6000", name: "Expenses", type: "EXPENSE" as const, normalBalance: "DEBIT" as const, isHeader: true },
    { code: "6001", name: "Salaries & Wages", type: "EXPENSE" as const, normalBalance: "DEBIT" as const },
    { code: "6002", name: "Rent", type: "EXPENSE" as const, normalBalance: "DEBIT" as const },
    { code: "6003", name: "Utilities", type: "EXPENSE" as const, normalBalance: "DEBIT" as const },
    { code: "6004", name: "Marketing", type: "EXPENSE" as const, normalBalance: "DEBIT" as const },
  ];

  for (const account of accounts) {
    await prisma.chartOfAccount.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: account.code } },
      update: {},
      create: { tenantId: tenant.id, ...account },
    });
  }

  // Employee profiles
  await prisma.employeeProfile.upsert({
    where: { userId: salesUser.id },
    update: {},
    create: {
      userId: salesUser.id,
      tenantId: tenant.id,
      employmentType: "PERMANENT",
      basicSalary: 80000,
      hra: 20000,
      medicalAllow: 10000,
      conveyanceAllow: 5000,
    },
  });

  await prisma.employeeProfile.upsert({
    where: { userId: financeUser.id },
    update: {},
    create: {
      userId: financeUser.id,
      tenantId: tenant.id,
      employmentType: "PERMANENT",
      basicSalary: 120000,
      hra: 30000,
      medicalAllow: 15000,
      conveyanceAllow: 8000,
    },
  });

  console.log("Seed completed successfully!");
  console.log(`Tenant: ${tenant.name} (${tenant.id})`);
  console.log("Users: admin@wisemarket.com.pk / Admin@123");
  console.log("       sales@wisemarket.com.pk / Sales@123");
  console.log("       finance@wisemarket.com.pk / Finance@123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
