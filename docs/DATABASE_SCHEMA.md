# Database Schema — Prisma Models

All models include: `id` (UUID), `tenantId` (UUID FK), `createdAt`, `updatedAt`, `createdBy` (UUID nullable), `isDeleted` (Boolean default false).

## Prisma Schema Configuration

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

## Core Identity

```prisma
model Tenant {
  id            String   @id @default(uuid())
  name          String
  slug          String   @unique
  domain        String?  @unique
  logoUrl       String?
  config        Json     @default("{}")
  plan          PlanType @default(STARTER)
  planExpiresAt DateTime?
  status        TenantStatus @default(TRIAL)
  billingEmail  String?
  maxUsers      Int      @default(10)
  maxStorageGb  Int      @default(5)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  id            String   @id @default(uuid())
  tenantId      String
  email         String
  passwordHash  String?
  fullName      String
  phone         String?
  avatarUrl     String?
  roleId        String?
  departmentId  String?
  locationId    String?
  employeeCode  String?
  designation   String?
  reportingTo   String?
  dateOfJoining DateTime?
  cnic          String?
  status        UserStatus @default(ACTIVE)
  lastLoginAt   DateTime?
  mfaEnabled    Boolean  @default(false)
  preferences   Json     @default("{}")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  isDeleted     Boolean  @default(false)
  @@unique([tenantId, email])
}

model Role {
  id          String  @id @default(uuid())
  tenantId    String
  name        String
  slug        String
  permissions Json    // ["inventory:read:all","orders:write:own"]
  isSystem    Boolean @default(false)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([tenantId, slug])
}

model Department {
  id        String  @id @default(uuid())
  tenantId  String
  name      String
  parentId  String?
  headId    String?
  code      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Location {
  id              String  @id @default(uuid())
  tenantId        String
  name            String
  type            LocationType
  addressLine1    String?
  addressLine2    String?
  city            String?
  stateProvince   String?
  country         String  @default("PK")
  postalCode      String?
  latitude        Decimal? @db.Decimal(10,7)
  longitude       Decimal? @db.Decimal(10,7)
  phone           String?
  operatingHours  Json?
  isActive        Boolean @default(true)
  geoFenceRadiusM Int     @default(200)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Inventory & Products

```prisma
model Category {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  slug        String
  parentId    String?
  vertical    Vertical
  icon        String?
  sortOrder   Int      @default(0)
  seoTitle    String?
  seoDesc     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([tenantId, slug, vertical])
}

model Product {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  slug            String
  sku             String
  barcode         String?
  categoryId      String
  brand           String?
  shortDesc       String?
  longDesc        String?  @db.Text
  basePrice       Decimal  @db.Decimal(12,2)
  costPrice       Decimal? @db.Decimal(12,2)
  compareAtPrice  Decimal? @db.Decimal(12,2)
  taxRatePct      Decimal  @default(0) @db.Decimal(5,2)
  taxInclusive    Boolean  @default(true)
  weightKg        Decimal? @db.Decimal(8,3)
  dimensions      Json?
  attributes      Json     @default("{}")
  seoTitle        String?
  seoDesc         String?
  status          ProductStatus @default(DRAFT)
  isFeatured      Boolean  @default(false)
  isRefurbished   Boolean  @default(false)
  refurbishGrade  String?
  warrantyMonths  Int      @default(0)
  sellerId        String?
  publishedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isDeleted       Boolean  @default(false)
  @@unique([tenantId, sku])
}

model ProductVariant {
  id            String   @id @default(uuid())
  productId     String
  tenantId      String
  sku           String
  name          String?
  priceOverride Decimal? @db.Decimal(12,2)
  costOverride  Decimal? @db.Decimal(12,2)
  attributes    Json?
  barcode       String?
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ProductImage {
  id        String  @id @default(uuid())
  productId String
  tenantId  String
  url       String
  altText   String?
  sortOrder Int     @default(0)
  isPrimary Boolean @default(false)
  variantId String?
  createdAt DateTime @default(now())
}

model InventoryStock {
  id               String @id @default(uuid())
  tenantId         String
  productId        String
  variantId        String?
  locationId       String
  qtyOnHand        Int    @default(0)
  qtyCommitted     Int    @default(0)
  qtyIncoming      Int    @default(0)
  reorderPoint     Int    @default(10)
  reorderQty       Int    @default(50)
  binLocation      String?
  batchNumber      String?
  serialNumbers    String[]
  lastCountedAt    DateTime?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  @@unique([tenantId, productId, variantId, locationId])
}

model StockMovement {
  id            String   @id @default(uuid())
  tenantId      String
  productId     String
  variantId     String?
  locationId    String
  type          StockMovementType
  quantity      Int
  referenceType String?
  referenceId   String?
  notes         String?
  costPerUnit   Decimal? @db.Decimal(12,2)
  createdBy     String?
  createdAt     DateTime @default(now())
}
```

## Vehicles (WiseWheels)

```prisma
model Vehicle {
  id              String   @id @default(uuid())
  tenantId        String
  sellerId        String
  listingType     ListingType
  condition       VehicleCondition
  make            String
  model           String
  variantName     String?
  year            Int
  mileageKm       Int?
  fuelType        FuelType?
  transmission    TransmissionType?
  engineCc        Int?
  bodyType        BodyType?
  color           String?
  registrationCity String?
  registrationYear Int?
  numOwners       Int      @default(1)
  vin             String?
  price           Decimal  @db.Decimal(12,2)
  priceNegotiable Boolean  @default(true)
  description     String?  @db.Text
  features        String[]
  city            String
  area            String?
  latitude        Decimal? @db.Decimal(10,7)
  longitude       Decimal? @db.Decimal(10,7)
  status          VehicleStatus @default(DRAFT)
  isFeatured      Boolean  @default(false)
  featuredUntil   DateTime?
  viewsCount      Int      @default(0)
  inquiriesCount  Int      @default(0)
  fairMarketValue Decimal? @db.Decimal(12,2)
  publishedAt     DateTime?
  expiresAt       DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isDeleted       Boolean  @default(false)
}

model VehicleImage {
  id        String @id @default(uuid())
  vehicleId String
  tenantId  String
  url       String
  label     String?
  sortOrder Int    @default(0)
  createdAt DateTime @default(now())
}

model VehicleInspection {
  id             String   @id @default(uuid())
  tenantId       String
  vehicleId      String
  inspectorId    String?
  requestedBy    String?
  inspectionDate DateTime?
  locationType   String?
  locationAddr   String?
  status         InspectionStatus @default(REQUESTED)
  overallScore   Decimal? @db.Decimal(3,1)
  checklist      Json?
  photos         Json?
  summary        String?  @db.Text
  feeAmount      Decimal  @default(2500) @db.Decimal(10,2)
  feePaid        Boolean  @default(false)
  reportUrl      String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

## Real Estate (OZ Developers)

```prisma
model ReProject {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  slug            String
  description     String?  @db.Text
  address         String?
  city            String?
  latitude        Decimal? @db.Decimal(10,7)
  longitude       Decimal? @db.Decimal(10,7)
  totalTowers     Int?
  totalFloors     Int?
  totalUnits      Int?
  projectType     ProjectType
  status          ProjectStatus @default(PRE_LAUNCH)
  constructionPct Decimal  @default(0) @db.Decimal(5,2)
  launchDate      DateTime?
  expectedCompletion DateTime?
  brochureUrl     String?
  videoTourUrl    String?
  liveCamUrl      String?
  amenities       String[]
  coverImageUrl   String?
  galleryUrls     String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ReUnit {
  id              String   @id @default(uuid())
  tenantId        String
  projectId       String
  towerBlock      String?
  floorNumber     Int
  unitNumber      String
  unitType        UnitType
  carpetAreaSqft  Decimal? @db.Decimal(10,2)
  coveredAreaSqft Decimal? @db.Decimal(10,2)
  facing          String?
  floorPlanUrl    String?
  render3dUrl     String?
  baseRatePerSqft Decimal? @db.Decimal(10,2)
  floorPremiumPct Decimal  @default(0) @db.Decimal(5,2)
  cornerPremiumPct Decimal @default(0) @db.Decimal(5,2)
  totalPrice      Decimal  @db.Decimal(14,2)
  status          UnitStatus @default(AVAILABLE)
  reservedUntil   DateTime?
  reservedBy      String?
  features        String[]
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ReBooking {
  id                String   @id @default(uuid())
  tenantId          String
  unitId            String
  customerId        String
  agentId           String?
  dealerId          String?
  bookingDate       DateTime
  bookingNumber     String   @unique
  totalAmount       Decimal  @db.Decimal(14,2)
  downPayment       Decimal  @db.Decimal(14,2)
  installmentPlanId String?
  status            BookingStatus @default(PENDING)
  allotmentLetterUrl String?
  agreementUrl      String?
  notes             String?
  cancelledAt       DateTime?
  cancellationReason String?
  refundAmount      Decimal? @db.Decimal(14,2)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model ReInstallmentPlan {
  id              String  @id @default(uuid())
  tenantId        String
  name            String
  projectId       String?
  downPaymentPct  Decimal @db.Decimal(5,2)
  numInstallments Int
  frequency       Frequency
  possessionPaymentPct Decimal @default(0) @db.Decimal(5,2)
  isActive        Boolean @default(true)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model ReInstallment {
  id              String   @id @default(uuid())
  tenantId        String
  bookingId       String
  installmentNo   Int
  label           String?
  dueDate         DateTime
  amountDue       Decimal  @db.Decimal(14,2)
  amountPaid      Decimal  @default(0) @db.Decimal(14,2)
  paidDate        DateTime?
  paymentMethod   String?
  paymentRef      String?
  status          InstallmentStatus @default(UPCOMING)
  lateFee         Decimal  @default(0) @db.Decimal(10,2)
  receiptUrl      String?
  reminderSent    Boolean  @default(false)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Sales & Orders

```prisma
model Customer {
  id              String   @id @default(uuid())
  tenantId        String
  type            CustomerType @default(INDIVIDUAL)
  fullName        String
  email           String?
  phone           String
  whatsapp        String?
  cnic            String?
  companyName     String?
  ntn             String?
  segment         CustomerSegment @default(NEW)
  loyaltyTier     LoyaltyTier @default(BRONZE)
  loyaltyPoints   Int      @default(0)
  lifetimeValue   Decimal  @default(0) @db.Decimal(14,2)
  source          String?
  tags            String[]
  notes           String?
  currency        String   @default("PKR")
  preferredLang   String   @default("en")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isDeleted       Boolean  @default(false)
}

model CustomerAddress {
  id            String  @id @default(uuid())
  customerId    String
  tenantId      String
  label         String?
  addressLine1  String
  addressLine2  String?
  city          String
  stateProvince String?
  postalCode    String?
  country       String  @default("PK")
  phone         String?
  isDefault     Boolean @default(false)
  latitude      Decimal? @db.Decimal(10,7)
  longitude     Decimal? @db.Decimal(10,7)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Order {
  id              String   @id @default(uuid())
  tenantId        String
  orderNumber     String   @unique
  customerId      String
  channel         OrderChannel
  status          OrderStatus @default(DRAFT)
  subtotal        Decimal  @db.Decimal(12,2)
  discountAmount  Decimal  @default(0) @db.Decimal(12,2)
  taxAmount       Decimal  @default(0) @db.Decimal(12,2)
  shippingAmount  Decimal  @default(0) @db.Decimal(12,2)
  totalAmount     Decimal  @db.Decimal(12,2)
  currency        String   @default("PKR")
  paymentMethod   String?
  paymentStatus   PaymentStatus @default(PENDING)
  shippingAddrId  String?
  billingAddrId   String?
  couponCode      String?
  notes           String?
  internalNotes   String?
  placedAt        DateTime?
  confirmedAt     DateTime?
  shippedAt       DateTime?
  deliveredAt     DateTime?
  cancelledAt     DateTime?
  cancellationReason String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isDeleted       Boolean  @default(false)
}

model OrderItem {
  id              String  @id @default(uuid())
  orderId         String
  tenantId        String
  productId       String
  variantId       String?
  productName     String
  sku             String
  quantity        Int
  unitPrice       Decimal @db.Decimal(12,2)
  discountAmount  Decimal @default(0) @db.Decimal(12,2)
  taxAmount       Decimal @default(0) @db.Decimal(12,2)
  totalAmount     Decimal @db.Decimal(12,2)
  locationId      String?
  fulfillStatus   FulfillmentStatus @default(PENDING)
  notes           String?
  createdAt       DateTime @default(now())
}

model Shipment {
  id              String   @id @default(uuid())
  tenantId        String
  orderId         String
  courier         String?
  trackingNumber  String?
  trackingUrl     String?
  status          ShipmentStatus @default(LABEL_CREATED)
  weightKg        Decimal? @db.Decimal(8,3)
  shippingCost    Decimal? @db.Decimal(10,2)
  codAmount       Decimal? @db.Decimal(12,2)
  codCollected    Boolean  @default(false)
  estimatedDelivery DateTime?
  actualDelivery  DateTime?
  deliveryProof   Json?
  locationId      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## Finance

```prisma
model ChartOfAccount {
  id            String  @id @default(uuid())
  tenantId      String
  code          String
  name          String
  type          AccountType
  parentId      String?
  isHeader      Boolean @default(false)
  isSystem      Boolean @default(false)
  normalBalance NormalBalance
  currency      String  @default("PKR")
  isActive      Boolean @default(true)
  description   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([tenantId, code])
}

model JournalEntry {
  id            String   @id @default(uuid())
  tenantId      String
  entryNumber   String   @unique
  entryDate     DateTime
  description   String
  referenceType String?
  referenceId   String?
  status        JournalStatus @default(DRAFT)
  approvedBy    String?
  approvedAt    DateTime?
  postedAt      DateTime?
  fiscalYear    Int?
  fiscalPeriod  Int?
  isRecurring   Boolean  @default(false)
  recurrenceRule Json?
  totalDebit    Decimal? @db.Decimal(14,2)
  totalCredit   Decimal? @db.Decimal(14,2)
  attachments   String[]
  createdBy     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model JournalLine {
  id             String  @id @default(uuid())
  journalEntryId String
  tenantId       String
  accountId      String
  debitAmount    Decimal @default(0) @db.Decimal(14,2)
  creditAmount   Decimal @default(0) @db.Decimal(14,2)
  description    String?
  costCenter     String?
  projectId      String?
  dimension1     String?
  dimension2     String?
  createdAt      DateTime @default(now())
}

model Invoice {
  id            String   @id @default(uuid())
  tenantId      String
  invoiceNumber String   @unique
  type          InvoiceType
  customerId    String?
  vendorId      String?
  orderId       String?
  bookingId     String?
  invoiceDate   DateTime
  dueDate       DateTime
  status        InvoiceStatus @default(DRAFT)
  subtotal      Decimal  @db.Decimal(14,2)
  discountAmt   Decimal  @default(0) @db.Decimal(14,2)
  taxAmount     Decimal  @default(0) @db.Decimal(14,2)
  totalAmount   Decimal  @db.Decimal(14,2)
  amountPaid    Decimal  @default(0) @db.Decimal(14,2)
  currency      String   @default("PKR")
  exchangeRate  Decimal  @default(1) @db.Decimal(10,4)
  paymentTerms  String?
  ntn           String?
  strn          String?
  notes         String?
  termsText     String?
  pdfUrl        String?
  sentAt        DateTime?
  viewedAt      DateTime?
  paidAt        DateTime?
  journalEntryId String?
  createdBy     String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model InvoiceItem {
  id          String  @id @default(uuid())
  invoiceId   String
  tenantId    String
  description String
  productId   String?
  quantity    Decimal @db.Decimal(10,2)
  unitPrice   Decimal @db.Decimal(12,2)
  discountPct Decimal @default(0) @db.Decimal(5,2)
  taxRatePct  Decimal @default(0) @db.Decimal(5,2)
  taxAmount   Decimal @default(0) @db.Decimal(12,2)
  totalAmount Decimal @db.Decimal(12,2)
  accountId   String?
  createdAt   DateTime @default(now())
}

model Payment {
  id              String   @id @default(uuid())
  tenantId        String
  paymentNumber   String   @unique
  type            PaymentType
  customerId      String?
  vendorId        String?
  invoiceId       String?
  orderId         String?
  bookingId       String?
  installmentId   String?
  amount          Decimal  @db.Decimal(14,2)
  currency        String   @default("PKR")
  paymentMethod   PayMethod
  gatewayProvider String?
  gatewayTxnId    String?
  gatewayResponse Json?
  bankAccountId   String?
  chequeNumber    String?
  chequeDate      DateTime?
  chequeStatus    ChequeStatus?
  reference       String?
  paymentDate     DateTime
  status          TxnStatus @default(PENDING)
  receiptUrl      String?
  notes           String?
  journalEntryId  String?
  createdBy       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model BankAccount {
  id              String  @id @default(uuid())
  tenantId        String
  accountName     String
  bankName        String
  accountNumber   String?
  iban            String?
  branch          String?
  swiftCode       String?
  currency        String  @default("PKR")
  openingBalance  Decimal @default(0) @db.Decimal(14,2)
  currentBalance  Decimal @default(0) @db.Decimal(14,2)
  glAccountId     String?
  isActive        Boolean @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model TaxRate {
  id          String  @id @default(uuid())
  tenantId    String
  name        String
  ratePct     Decimal @db.Decimal(5,2)
  type        TaxType
  isCompound  Boolean @default(false)
  glAccountId String?
  isActive    Boolean @default(true)
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model FiscalPeriod {
  id           String @id @default(uuid())
  tenantId     String
  fiscalYear   Int
  periodNumber Int
  startDate    DateTime
  endDate      DateTime
  status       PeriodStatus @default(OPEN)
  closedBy     String?
  closedAt     DateTime?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

model BudgetLine {
  id            String  @id @default(uuid())
  tenantId      String
  fiscalYear    Int
  fiscalPeriod  Int
  accountId     String
  departmentId  String?
  projectId     String?
  budgetedAmt   Decimal @db.Decimal(14,2)
  actualAmt     Decimal @default(0) @db.Decimal(14,2)
  notes         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model FixedAsset {
  id              String   @id @default(uuid())
  tenantId        String
  assetTag        String
  name            String
  category        AssetCategory
  locationId      String?
  departmentId    String?
  custodianId     String?
  acquisitionDate DateTime
  acquisitionCost Decimal  @db.Decimal(14,2)
  salvageValue    Decimal  @default(0) @db.Decimal(14,2)
  usefulLifeMonths Int
  depreciationMethod DepMethod @default(STRAIGHT_LINE)
  accumDepreciation Decimal @default(0) @db.Decimal(14,2)
  netBookValue    Decimal  @db.Decimal(14,2)
  status          AssetStatus @default(ACTIVE)
  disposalDate    DateTime?
  disposalAmount  Decimal? @db.Decimal(14,2)
  insurancePolicy String?
  warrantyExpiry  DateTime?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

## CRM & Leads

```prisma
model Lead {
  id              String   @id @default(uuid())
  tenantId        String
  customerId      String?
  vertical        Vertical
  source          String?
  campaignId      String?
  assignedTo      String?
  teamId          String?
  stage           String
  score           Int      @default(0)
  temperature     LeadTemp @default(COLD)
  title           String?
  estimatedValue  Decimal? @db.Decimal(14,2)
  probabilityPct  Decimal  @default(0) @db.Decimal(5,2)
  expectedCloseDate DateTime?
  actualCloseDate DateTime?
  lostReason      String?
  status          LeadStatus @default(NEW)
  interestedProjectId String?
  interestedUnitType  String?
  budgetRange     Json?
  interestedMake  String?
  interestedModel String?
  nextFollowUp    DateTime?
  tags            String[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  isDeleted       Boolean  @default(false)
}

model Activity {
  id          String   @id @default(uuid())
  tenantId    String
  type        ActivityType
  leadId      String?
  customerId  String?
  userId      String
  subject     String?
  description String?  @db.Text
  outcome     String?
  scheduledAt DateTime?
  completedAt DateTime?
  durationMin Int?
  isCompleted Boolean  @default(false)
  attachments String[]
  metadata    Json?
  createdAt   DateTime @default(now())
}
```

## HR & Payroll

```prisma
model EmployeeProfile {
  id              String  @id @default(uuid())
  userId          String  @unique
  tenantId        String
  employeeCode    String?
  employmentType  EmploymentType @default(PERMANENT)
  dateOfBirth     DateTime?
  gender          Gender?
  maritalStatus   MaritalStatus?
  bloodGroup      String?
  emergencyName   String?
  emergencyPhone  String?
  bankName        String?
  bankAccountNo   String?
  bankIban        String?
  eobiNumber      String?
  taxNtn          String?
  basicSalary     Decimal? @db.Decimal(12,2)
  hra             Decimal? @db.Decimal(12,2)
  medicalAllow    Decimal? @db.Decimal(12,2)
  conveyanceAllow Decimal? @db.Decimal(12,2)
  otherAllowances Json    @default("{}")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AttendanceRecord {
  id              String   @id @default(uuid())
  tenantId        String
  userId          String
  date            DateTime
  checkInTime     DateTime?
  checkOutTime    DateTime?
  checkInLat      Decimal? @db.Decimal(10,7)
  checkInLng      Decimal? @db.Decimal(10,7)
  checkOutLat     Decimal? @db.Decimal(10,7)
  checkOutLng     Decimal? @db.Decimal(10,7)
  checkInLocationId String?
  isWithinGeofence Boolean?
  workingHours    Decimal? @db.Decimal(4,2)
  overtimeHours   Decimal? @db.Decimal(4,2)
  status          AttendanceStatus @default(PRESENT)
  source          AttendanceSource @default(MOBILE_APP)
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([tenantId, userId, date])
}

model LeaveRequest {
  id            String   @id @default(uuid())
  tenantId      String
  userId        String
  leaveType     LeaveType
  startDate     DateTime
  endDate       DateTime
  totalDays     Decimal  @db.Decimal(4,1)
  reason        String?
  status        LeaveStatus @default(PENDING)
  approvedBy    String?
  approvedAt    DateTime?
  rejectionReason String?
  attachmentUrl String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model LeaveBalance {
  id          String @id @default(uuid())
  tenantId    String
  userId      String
  fiscalYear  Int
  leaveType   LeaveType
  entitled    Decimal @db.Decimal(4,1)
  used        Decimal @default(0) @db.Decimal(4,1)
  carriedFwd  Decimal @default(0) @db.Decimal(4,1)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  @@unique([tenantId, userId, fiscalYear, leaveType])
}

model KpiDefinition {
  id            String  @id @default(uuid())
  tenantId      String
  name          String
  description   String?
  category      String?
  metricType    MetricType
  targetValue   Decimal? @db.Decimal(14,2)
  unit          String?
  frequency     KpiFrequency
  applicableRoles String[]
  isActive      Boolean @default(true)
  weightPct     Decimal @default(100) @db.Decimal(5,2)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model KpiScore {
  id            String  @id @default(uuid())
  tenantId      String
  userId        String
  kpiId         String
  periodStart   DateTime
  periodEnd     DateTime
  targetValue   Decimal? @db.Decimal(14,2)
  actualValue   Decimal? @db.Decimal(14,2)
  rating        PerformanceRating?
  managerComments String?
  employeeComments String?
  status        KpiScoreStatus @default(PENDING)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model PayrollRun {
  id             String   @id @default(uuid())
  tenantId       String
  month          Int
  year           Int
  status         PayrollStatus @default(DRAFT)
  totalGross     Decimal? @db.Decimal(14,2)
  totalDeductions Decimal? @db.Decimal(14,2)
  totalNet       Decimal? @db.Decimal(14,2)
  totalEmployees Int?
  processedBy    String?
  approvedBy     String?
  disbursedAt    DateTime?
  journalEntryId String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model PayrollSlip {
  id             String  @id @default(uuid())
  payrollRunId   String
  tenantId       String
  userId         String
  basicSalary    Decimal? @db.Decimal(12,2)
  hra            Decimal? @db.Decimal(12,2)
  medical        Decimal? @db.Decimal(12,2)
  conveyance     Decimal? @db.Decimal(12,2)
  overtimeAmt    Decimal? @db.Decimal(12,2)
  commission     Decimal? @db.Decimal(12,2)
  bonus          Decimal? @db.Decimal(12,2)
  otherEarnings  Json     @default("{}")
  grossSalary    Decimal? @db.Decimal(12,2)
  incomeTax      Decimal? @db.Decimal(12,2)
  eobiEmployee   Decimal? @db.Decimal(12,2)
  providentFund  Decimal? @db.Decimal(12,2)
  loanDeduction  Decimal? @db.Decimal(12,2)
  otherDeductions Json    @default("{}")
  totalDeductions Decimal? @db.Decimal(12,2)
  netSalary      Decimal? @db.Decimal(12,2)
  workingDays    Int?
  presentDays    Int?
  leaveDays      Decimal? @db.Decimal(4,1)
  overtimeHours  Decimal? @db.Decimal(6,2)
  pdfUrl         String?
  disbursementMethod String?
  disbursementRef String?
  createdAt      DateTime @default(now())
}
```

## Support & Notifications

```prisma
model Ticket {
  id             String   @id @default(uuid())
  tenantId       String
  ticketNumber   String   @unique
  customerId     String
  vertical       String?
  category       TicketCategory
  subject        String
  description    String?  @db.Text
  priority       Priority @default(MEDIUM)
  status         TicketStatus @default(OPEN)
  assignedTo     String?
  escalatedTo    String?
  orderId        String?
  vehicleId      String?
  bookingId      String?
  slaResponseDue DateTime?
  slaResolutionDue DateTime?
  firstResponseAt DateTime?
  resolvedAt     DateTime?
  satisfactionScore Int?
  satisfactionComment String?
  channel        TicketChannel @default(PORTAL)
  tags           String[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}

model TicketMessage {
  id         String  @id @default(uuid())
  ticketId   String
  tenantId   String
  senderType SenderType
  senderId   String?
  message    String  @db.Text
  isInternal Boolean @default(false)
  attachments Json?
  sentiment  String?
  createdAt  DateTime @default(now())
}

model Notification {
  id           String   @id @default(uuid())
  tenantId     String
  recipientType String
  recipientId  String
  channel      NotifChannel
  templateKey  String?
  subject      String?
  body         String?  @db.Text
  data         Json?
  status       NotifStatus @default(PENDING)
  sentAt       DateTime?
  deliveredAt  DateTime?
  readAt       DateTime?
  errorMessage String?
  externalId   String?
  createdAt    DateTime @default(now())
}

model Document {
  id         String   @id @default(uuid())
  tenantId   String
  name       String
  type       DocType
  fileUrl    String
  fileSize   Int?
  mimeType   String?
  entityType String?
  entityId   String?
  customerId String?
  version    Int      @default(1)
  isSigned   Boolean  @default(false)
  signedAt   DateTime?
  signedBy   String?
  expiresAt  DateTime?
  tags       String[]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model AuditLog {
  id         String   @id @default(uuid())
  tenantId   String?
  userId     String?
  action     AuditAction
  entityType String
  entityId   String?
  changes    Json?
  ipAddress  String?
  userAgent  String?
  metadata   Json?
  createdAt  DateTime @default(now())
}

model Campaign {
  id              String   @id @default(uuid())
  tenantId        String
  name            String
  type            CampaignType
  status          CampaignStatus @default(DRAFT)
  segmentRules    Json?
  templateId      String?
  scheduledAt     DateTime?
  startedAt       DateTime?
  completedAt     DateTime?
  totalRecipients Int      @default(0)
  sentCount       Int      @default(0)
  deliveredCount  Int      @default(0)
  openedCount     Int      @default(0)
  clickedCount    Int      @default(0)
  conversionCount Int      @default(0)
  conversionValue Decimal  @default(0) @db.Decimal(14,2)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model Coupon {
  id              String   @id @default(uuid())
  tenantId        String
  code            String
  name            String?
  discountType    DiscountType
  discountValue   Decimal  @db.Decimal(10,2)
  minOrderValue   Decimal  @default(0) @db.Decimal(12,2)
  maxDiscountAmt  Decimal? @db.Decimal(12,2)
  usageLimit      Int?
  perCustomerLimit Int     @default(1)
  usedCount       Int      @default(0)
  validFrom       DateTime
  validUntil      DateTime
  isActive        Boolean  @default(true)
  vertical        String   @default("all")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  @@unique([tenantId, code])
}
```

## Enums (define all in schema.prisma)

```prisma
enum PlanType { STARTER PROFESSIONAL ENTERPRISE CUSTOM }
enum TenantStatus { ACTIVE SUSPENDED TRIAL CANCELLED }
enum UserStatus { ACTIVE INACTIVE SUSPENDED }
enum LocationType { WAREHOUSE STORE OFFICE SALES_GALLERY INSPECTION_CENTER }
enum Vertical { ECOMMERCE AUTOMOTIVE REALESTATE }
enum ProductStatus { DRAFT ACTIVE ARCHIVED OUT_OF_STOCK }
enum StockMovementType { PURCHASE_IN SALE_OUT TRANSFER_IN TRANSFER_OUT ADJUSTMENT RETURN_IN DAMAGE_OUT }
enum ListingType { INDIVIDUAL DEALER }
enum VehicleCondition { NEW CERTIFIED_PREOWNED USED_EXCELLENT USED_GOOD USED_FAIR SALVAGE }
enum FuelType { PETROL DIESEL HYBRID ELECTRIC CNG LPG }
enum TransmissionType { AUTOMATIC MANUAL CVT DCT }
enum BodyType { SEDAN SUV HATCHBACK CROSSOVER TRUCK VAN COUPE WAGON BUS }
enum VehicleStatus { DRAFT PENDING_REVIEW ACTIVE SOLD EXPIRED REMOVED }
enum InspectionStatus { REQUESTED SCHEDULED IN_PROGRESS COMPLETED CANCELLED }
enum ProjectType { RESIDENTIAL COMMERCIAL MIXED_USE }
enum ProjectStatus { PRE_LAUNCH LAUNCHED UNDER_CONSTRUCTION NEAR_COMPLETION COMPLETED HANDOVER }
enum UnitType { APT_1BED APT_2BED APT_3BED PENTHOUSE STUDIO SHOP_SMALL SHOP_MEDIUM SHOP_LARGE SHOWROOM OFFICE PARKING }
enum UnitStatus { AVAILABLE RESERVED TOKEN_RECEIVED BOOKED SOLD TRANSFERRED CANCELLED }
enum BookingStatus { PENDING CONFIRMED ACTIVE COMPLETED CANCELLED TRANSFERRED }
enum Frequency { MONTHLY QUARTERLY HALF_YEARLY YEARLY }
enum InstallmentStatus { UPCOMING DUE OVERDUE PAID PARTIALLY_PAID WAIVED }
enum CustomerType { INDIVIDUAL BUSINESS DEALER }
enum CustomerSegment { NEW RETURNING VIP WHOLESALE OVERSEAS }
enum LoyaltyTier { BRONZE SILVER GOLD PLATINUM }
enum OrderChannel { WEBSITE WHATSAPP PHONE WALKIN MARKETPLACE }
enum OrderStatus { DRAFT PENDING_PAYMENT CONFIRMED PROCESSING PACKED SHIPPED OUT_FOR_DELIVERY DELIVERED RETURN_REQUESTED RETURNED REFUNDED CANCELLED ON_HOLD }
enum PaymentStatus { PENDING PARTIAL PAID REFUNDED FAILED }
enum FulfillmentStatus { PENDING PICKED PACKED SHIPPED DELIVERED RETURNED }
enum ShipmentStatus { LABEL_CREATED PICKED_UP IN_TRANSIT OUT_FOR_DELIVERY DELIVERED RETURNED LOST }
enum AccountType { ASSET LIABILITY EQUITY REVENUE COGS EXPENSE OTHER_INCOME OTHER_EXPENSE }
enum NormalBalance { DEBIT CREDIT }
enum JournalStatus { DRAFT PENDING_APPROVAL APPROVED POSTED VOIDED }
enum InvoiceType { SALES PURCHASE CREDIT_NOTE DEBIT_NOTE PROFORMA }
enum InvoiceStatus { DRAFT SENT VIEWED PARTIAL PAID OVERDUE CANCELLED VOIDED }
enum PaymentType { RECEIPT PAYMENT REFUND ADVANCE TRANSFER }
enum PayMethod { CASH BANK_TRANSFER CHEQUE JAZZCASH EASYPAISA CREDIT_CARD DEBIT_CARD ONLINE_GATEWAY WALLET PAYORDER }
enum ChequeStatus { RECEIVED DEPOSITED CLEARED BOUNCED }
enum TxnStatus { PENDING PROCESSING COMPLETED FAILED REVERSED CANCELLED }
enum TaxType { SALES_TAX WITHHOLDING_TAX INCOME_TAX EXCISE_DUTY CUSTOM_DUTY }
enum PeriodStatus { OPEN CLOSING CLOSED LOCKED }
enum AssetCategory { LAND BUILDING MACHINERY FURNITURE VEHICLES COMPUTER INTANGIBLES OTHER }
enum DepMethod { STRAIGHT_LINE REDUCING_BALANCE SUM_OF_YEARS UNITS_OF_PRODUCTION }
enum AssetStatus { ACTIVE DISPOSED WRITTEN_OFF }
enum LeadTemp { COLD WARM HOT ON_FIRE }
enum LeadStatus { NEW CONTACTED QUALIFIED PROPOSAL_SENT NEGOTIATION WON LOST DISQUALIFIED }
enum ActivityType { CALL EMAIL WHATSAPP SMS MEETING SITE_VISIT TEST_DRIVE NOTE TASK FOLLOW_UP }
enum EmploymentType { PERMANENT CONTRACT PROBATION INTERN FREELANCE }
enum Gender { MALE FEMALE OTHER }
enum MaritalStatus { SINGLE MARRIED WIDOWED DIVORCED }
enum AttendanceStatus { PRESENT ABSENT HALF_DAY LATE ON_LEAVE HOLIDAY WORK_FROM_HOME }
enum AttendanceSource { MOBILE_APP WEB BIOMETRIC MANUAL }
enum LeaveType { ANNUAL CASUAL SICK MATERNITY PATERNITY UNPAID BEREAVEMENT HAJJ }
enum LeaveStatus { PENDING APPROVED REJECTED CANCELLED }
enum MetricType { NUMBER CURRENCY PERCENTAGE BOOLEAN RATING }
enum KpiFrequency { DAILY WEEKLY MONTHLY QUARTERLY YEARLY }
enum PerformanceRating { EXCEPTIONAL EXCEEDS MEETS BELOW UNSATISFACTORY }
enum KpiScoreStatus { PENDING SELF_ASSESSED MANAGER_REVIEWED FINALIZED }
enum PayrollStatus { DRAFT PROCESSING APPROVED DISBURSED CLOSED }
enum TicketCategory { ORDER_ISSUE PAYMENT_ISSUE PRODUCT_INQUIRY WARRANTY_CLAIM COMPLAINT SUGGESTION RETURN_REQUEST INSPECTION BOOKING GENERAL }
enum Priority { CRITICAL HIGH MEDIUM LOW }
enum TicketStatus { OPEN IN_PROGRESS WAITING_CUSTOMER WAITING_INTERNAL ESCALATED RESOLVED CLOSED REOPENED }
enum TicketChannel { EMAIL WHATSAPP PHONE WEBCHAT SOCIAL PORTAL }
enum SenderType { CUSTOMER AGENT SYSTEM AI }
enum NotifChannel { EMAIL SMS WHATSAPP PUSH IN_APP }
enum NotifStatus { PENDING SENT DELIVERED READ FAILED BOUNCED }
enum DocType { INVOICE RECEIPT ALLOTMENT_LETTER AGREEMENT INSPECTION_REPORT TAX_CERTIFICATE PAYSLIP QUOTATION PURCHASE_ORDER DELIVERY_NOTE CREDIT_NOTE CUSTOM }
enum AuditAction { CREATE READ UPDATE DELETE LOGIN LOGOUT EXPORT APPROVE REJECT SEND }
enum CampaignType { EMAIL SMS WHATSAPP PUSH MULTI_CHANNEL }
enum CampaignStatus { DRAFT SCHEDULED SENDING SENT PAUSED CANCELLED }
enum DiscountType { PERCENTAGE FIXED_AMOUNT FREE_SHIPPING BUY_X_GET_Y }
```
