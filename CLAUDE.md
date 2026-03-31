# CLAUDE.md — Master Development Instructions

## PROJECT: WisePlatform ERP
Integrated multi-tenant SaaS ERP for 3 verticals:
- **WiseMarket.com.pk** — E-commerce marketplace (electronics, fashion, general merchandise)
- **WiseWheels.com.pk** — Automotive classified (buy/sell cars, vehicle inspections)
- **OZ Developers** — Real estate (Bahria Sky, Lahore Sky, OZ Square — apartments, shops, offices)

Pakistan-first, global-ready (MENA, AUS, US, EU later via localization engine).

---

## TECH STACK (MANDATORY — do not substitute)

| Layer | Technology | 
|-------|-----------|
| Monorepo | Turborepo |
| Frontend | Next.js 14+ (App Router), TypeScript strict |
| UI | Tailwind CSS + shadcn/ui |
| State | Zustand (client) + TanStack Query (server) |
| Backend API | Node.js 20+, Express.js, TypeScript |
| ORM | Prisma 5+ |
| Database | PostgreSQL 16+ |
| Cache | Redis 7+ |
| Search | Meilisearch |
| File Storage | MinIO (S3-compatible) |
| Auth | NextAuth.js v5 + JWT |
| Validation | Zod (shared frontend + backend) |
| PDF Gen | Puppeteer + Handlebars templates |
| Excel Gen | ExcelJS |
| Charts | Recharts |
| Real-time | Socket.io |
| Employee App | React Native + Expo |
| Containers | Docker + Docker Compose |

---

## PROJECT STRUCTURE

```
wise-platform/
├── apps/
│   ├── web/                    # Next.js — main web app (customer + admin)
│   └── employee-app/           # React Native (Expo) — HR mobile app
├── packages/
│   ├── database/               # Prisma schema + migrations + seed
│   ├── api/                    # Express.js REST API
│   ├── shared/                 # Types, Zod schemas, constants, utils
│   ├── ui/                     # Shared React components (shadcn/ui)
│   └── reports/                # PDF/Excel report generation
├── docker-compose.yml          # PostgreSQL, Redis, Meilisearch, MinIO
├── turbo.json
├── package.json
├── .env.example
└── CLAUDE.md                   # This file
```

---

## MULTI-TENANT ARCHITECTURE

Every DB table has mandatory `tenant_id UUID NOT NULL` (except `tenants` table).
Prisma middleware auto-injects tenant_id from JWT into all queries.
PostgreSQL Row-Level Security (RLS) as secondary isolation layer.

**Auth flow:**
1. JWT contains: `{ user_id, tenant_id, role, permissions[] }`
2. Prisma middleware reads tenant_id from request context
3. All queries auto-filtered by tenant_id
4. Permission format: `module:action:scope` (e.g., `finance:approve:all`, `orders:read:team`)
5. Scopes: `all` (entire tenant), `team` (own department), `own` (own records)

---

## DATABASE SCHEMA

See `docs/DATABASE_SCHEMA.md` for complete Prisma models.

**Key entities (40+ models):**
- Core: tenants, users, roles, departments, locations
- Inventory: categories, products, product_variants, product_images, inventory_stock, stock_movements
- Vehicles: vehicles, vehicle_images, vehicle_inspections
- Real Estate: re_projects, re_units, re_bookings, re_installment_plans, re_installments
- Sales: customers, customer_addresses, orders, order_items, shipments, quotations
- Finance: chart_of_accounts, journal_entries, journal_lines, invoices, invoice_items, payments, bank_accounts, tax_rates, fiscal_periods, budget_lines, fixed_assets
- CRM: leads, activities, campaigns, coupons
- HR: employee_profiles, attendance_records, leave_requests, leave_balances, kpi_definitions, kpi_scores, payroll_runs, payroll_slips
- Support: tickets, ticket_messages
- System: notifications, documents, audit_logs

---

## API ENDPOINTS

See `docs/API_SPEC.md` for complete endpoint reference.

**Summary: 150+ REST endpoints across modules:**
- Auth: 11 endpoints
- Products/Inventory: 17 endpoints
- Orders/Sales: 17 endpoints
- Vehicles: 16 endpoints
- Real Estate: 21 endpoints
- CRM/Leads: 14 endpoints
- Finance: 35+ endpoints (invoices, payments, journal entries, reports, bank reconciliation, tax)
- HR: 25 endpoints (attendance, leave, KPIs, payroll)
- Support: 8 endpoints
- Marketing: 6 endpoints
- Admin: 12 endpoints
- Dashboard: 4 endpoints

**API conventions:**
- Base: `/api/v1`
- Auth: Bearer token (JWT) in Authorization header
- Response envelope: `{ success: boolean, data: T, error?: string, meta?: { page, pageSize, total } }`
- Pagination: `?page=1&pageSize=20`
- Sorting: `?sortBy=created_at&sortOrder=desc`
- Filtering: `?status=active&category_id=xxx`
- Dates: ISO 8601 format
- IDs: UUID v4

---

## EXECUTION PHASES

### Phase 1 (Hours 0-6): Foundation
1. `npx create-turbo@latest wise-platform`
2. Set up Next.js apps with TypeScript
3. Set up Express.js API with TypeScript
4. Create complete Prisma schema from docs/DATABASE_SCHEMA.md
5. docker-compose.yml (PostgreSQL 16, Redis 7, Meilisearch, MinIO)
6. `npx prisma migrate dev` — run initial migration
7. Set up shadcn/ui in packages/ui
8. Create shared Zod schemas in packages/shared
9. Create .env with all variables

### Phase 2 (Hours 6-12): Auth + Admin + Inventory
1. NextAuth.js with credentials + OTP providers
2. Prisma tenant middleware (auto tenant_id injection)
3. RBAC middleware with permission checking
4. Login/Register/Forgot-password pages
5. Admin: user management, role management, tenant settings
6. Product CRUD with image upload to MinIO
7. Variant management, stock levels dashboard
8. Stock adjustments, transfers, bulk CSV import
9. Meilisearch indexing for products

### Phase 3 (Hours 12-20): Orders + Finance Core
1. Customer-facing: product listing, detail, cart, checkout
2. Order management admin with status workflow
3. Quotation builder with PDF generation
4. Chart of Accounts management (Pakistan template preloaded)
5. Invoice CRUD with PDF generation (FBR-compliant fields: NTN, STRN, serial)
6. Payment recording and allocation
7. Journal entry creation with approval workflow
8. Financial reports: P&L, Balance Sheet, Trial Balance, GL Detail
9. AR aging report, AP aging report
10. Bank account management and reconciliation interface
11. Revenue analytics dashboard (Recharts)

### Phase 4 (Hours 20-28): CRM + WiseWheels + OZ Developers
1. Lead pipeline Kanban board
2. Customer 360 profile with cross-vertical tabs
3. Activity logging and follow-up management
4. Vehicle listing form with structured data + photo upload
5. Vehicle search with comprehensive filters
6. Inspection booking and digital checklist
7. Vehicle comparison page
8. Dealer portal
9. RE: project management, unit availability matrix (color-coded grid)
10. RE: booking workflow with installment schedule generation
11. RE: installment tracking with payment recording + reminders
12. RE: investor portal with payment status + construction updates

### Phase 5 (Hours 28-36): HR + Support + Marketing
1. Employee management in admin
2. Attendance APIs with geofence validation
3. Leave management (apply, approve, reject)
4. KPI definition, scoring, review
5. Payroll engine with Pakistan FBR tax slab calculation
6. Payslip PDF generation
7. Ticketing system with SLA management
8. Campaign management (email templates)
9. Coupon management
10. Notification service (email via Nodemailer + in-app via Socket.io)

### Phase 6 (Hours 36-44): Dashboards + Employee App + Polish
1. Executive dashboard (cross-vertical KPIs)
2. Vertical-specific dashboards
3. Custom report builder with export
4. Budget management with variance tracking
5. React Native employee app: login, geo-fenced attendance, leave, tasks, KPIs, payslips
6. Audit logging across all modules
7. Data import/export utilities
8. Seed script with demo data
9. README.md with complete setup instructions

---

## KEY BUSINESS RULES

### Pakistan-Specific (Phase 1)
- Currency: PKR (Pakistani Rupee)
- Fiscal year: July 1 — June 30
- Sales Tax (GST): 17% standard rate
- WHT on services: 8% (filer), 16% (non-filer)
- WHT on goods: 4.5% (filer), 9% (non-filer)
- FBR e-invoicing: NTN, STRN, sequential invoice numbers, QR code
- Income tax slabs: 0% up to 600K, progressive rates above
- COD is 60-70% of e-commerce — first-class support required
- EOBI contribution: employer + employee
- Payment methods: COD, JazzCash, Easypaisa, bank transfer, credit card

### Real Estate (OZ Developers)
- Projects: Bahria Sky, Bahria Sky 2, Lahore Sky, OZ Square
- Unit types: apartments (1/2/3-bed, penthouse, studio), shops (S/M/L), showrooms, offices, parking
- Installment plans: configurable down payment %, number of installments, frequency
- Overseas investors: multi-currency (AUD, AED, GBP, USD, KWD), time-zone aware
- Commission: milestone-based (on booking, on 50% collection, on possession)
- Construction updates: photo/video uploads with investor notifications

### Automotive (WiseWheels)
- Vehicle attributes: make, model, year, variant, mileage, fuel type, transmission, engine CC, body type, color, registration city, owners count
- Inspection: 150+ point checklist, PKR 2,500 minimum fee, photo evidence, 1-5 star score
- Dealer tiers with featured listing packages
- Price valuation based on market data

---

## CODING STANDARDS

- TypeScript strict mode everywhere
- Zod schemas shared between frontend and backend
- Server Components by default in Next.js, Client Components only when needed
- API routes return consistent envelope: `{ success, data, error, meta }`
- All database operations through Prisma (never raw SQL except for complex reports)
- Error handling: try/catch with typed error responses
- Logging: structured JSON logs with request ID
- Environment variables: never hardcoded, always from .env

---

## SCOPE EXCLUSIONS (Do NOT build)

- Customer-facing native mobile apps (Android/iOS) — only employee app via React Native
- POS system
- AI/ML chatbot (mock the interface, skip Claude API integration)
- Live payment gateway integration (use mock payment processor)
- Live courier API integration (mock tracking)
- Live WhatsApp Business API (mock messages, build the service layer)
- Live SMS integration (console.log, build the abstraction)
- White-label custom domain (architecture ready, UI deferred)
- Social media management tools
- AR product preview

---

## CRITICAL: What "done" looks like

After 2-3 days, the following must work end-to-end:

1. **Register tenant → Login → See dashboard**
2. **Add product → Set stock → Customer places order → Order appears in admin → Update status → Generate invoice → Record payment → See in P&L report**
3. **Create RE project → Add units → Customer books unit → Generate installment schedule → Record installment payment → See in collection dashboard**
4. **Create vehicle listing → Buyer searches → Books inspection → Inspector completes checklist → Report generated**
5. **Employee checks in (geo-fenced) → Applies leave → Manager approves → Payroll runs → Payslip generated**
6. **Executive dashboard shows real-time KPIs across all 3 verticals**
