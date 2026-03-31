# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project: WisePlatform ERP

Integrated multi-tenant SaaS ERP for 3 verticals:
- **WiseMarket.com.pk** — E-commerce marketplace (electronics, fashion, general merchandise)
- **WiseWheels.com.pk** — Automotive classified (buy/sell cars, vehicle inspections)
- **OZ Developers** — Real estate (Bahria Sky, Bahria Sky 2, Lahore Sky, OZ Square)

Pakistan-first, global-ready (MENA, AUS, US, EU via localization engine).

---

## Development Commands

```bash
# Start infrastructure (PostgreSQL, Redis, Meilisearch, MinIO)
docker compose up -d

# Install all workspace dependencies
npm install

# Run all apps in dev mode (Turborepo)
npm run dev

# Build all packages
npm run build

# Lint all packages
npm run lint

# Type-check all packages
npm run typecheck

# Database: create and apply a migration
cd packages/database && npx prisma migrate dev --name <migration_name>

# Database: regenerate Prisma client after schema changes
cd packages/database && npx prisma generate

# Database: seed demo data
cd packages/database && npx prisma db seed

# Run tests (from repo root or specific package)
npm run test
npm run test --filter=@wise/api       # single package
npx jest --testPathPattern=orders     # single test file
```

**Dev URLs:**
- Web App: http://localhost:3000
- API Server: http://localhost:4000
- MinIO Console: http://localhost:9001
- Meilisearch: http://localhost:7700

**Demo credentials:** `admin@wisemarket.com.pk / Admin@123`

---

## Architecture

### Monorepo Layout

```
wise-platform/
├── apps/
│   ├── web/              # Next.js 14 App Router — customer + admin UI
│   └── employee-app/     # React Native (Expo) — HR mobile app
├── packages/
│   ├── database/         # Prisma schema, migrations, seed
│   ├── api/              # Express.js REST API (Node 20+)
│   ├── shared/           # Zod schemas, TypeScript types, constants, utils (shared by all)
│   ├── ui/               # shadcn/ui component library (consumed by web)
│   └── reports/          # Puppeteer PDF + ExcelJS report generation
├── docker-compose.yml
├── turbo.json
└── .env.example
```

### Multi-Tenant Isolation

Every table (except `tenants`) has `tenant_id UUID NOT NULL`. Data isolation is enforced at two layers:

1. **Prisma middleware** — reads `tenant_id` from request context (set by auth middleware from JWT) and auto-injects it into every query.
2. **PostgreSQL RLS** — secondary enforcement at the database level.

Never bypass the middleware by constructing raw Prisma queries without tenant context.

### Auth & Permissions

JWT payload: `{ user_id, tenant_id, role, permissions[] }`

Permission format: `module:action:scope`
- Example: `finance:approve:all`, `orders:read:team`, `invoices:write:own`
- Scopes: `all` (entire tenant), `team` (own department), `own` (own records)

### API Conventions

- Base path: `/api/v1`
- Auth: `Authorization: Bearer <token>`
- All responses use the envelope: `{ success: boolean, data: T, error?: string, meta?: { page, pageSize, total } }`
- Pagination: `?page=1&pageSize=20` | Sorting: `?sortBy=created_at&sortOrder=desc`
- Dates: ISO 8601 | IDs: UUID v4

### Shared Zod Schemas

All request/response validation schemas live in `packages/shared`. Import them in both the API (`packages/api`) and frontend (`apps/web`) — never duplicate validation logic.

### Key Data Flow

`packages/shared` (types + Zod) → consumed by both `packages/api` and `apps/web`
`packages/database` (Prisma client) → consumed only by `packages/api`
`packages/ui` (React components) → consumed only by `apps/web`
`packages/reports` (PDF/Excel) → consumed only by `packages/api`

---

## Tech Stack (mandatory — do not substitute)

| Layer | Technology |
|---|---|
| Monorepo | Turborepo |
| Frontend | Next.js 14+ App Router, TypeScript strict |
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
| PDF | Puppeteer + Handlebars templates |
| Excel | ExcelJS |
| Charts | Recharts |
| Real-time | Socket.io |
| Employee App | React Native + Expo |
| Containers | Docker + Docker Compose |

---

## Database Schema

Full Prisma models are in `docs/DATABASE_SCHEMA.md`.

All models include: `id` (UUID), `tenantId` (UUID FK), `createdAt`, `updatedAt`, `createdBy` (nullable UUID), `isDeleted` (Boolean, soft-delete pattern).

Key model groups:
- **Core:** tenants, users, roles, departments, locations
- **Inventory:** categories, products, product_variants, product_images, inventory_stock, stock_movements
- **Vehicles:** vehicles, vehicle_images, vehicle_inspections
- **Real Estate:** re_projects, re_units, re_bookings, re_installment_plans, re_installments
- **Sales:** customers, customer_addresses, orders, order_items, shipments, quotations
- **Finance:** chart_of_accounts, journal_entries, journal_lines, invoices, invoice_items, payments, bank_accounts, tax_rates, fiscal_periods, budget_lines, fixed_assets
- **CRM:** leads, activities, campaigns, coupons
- **HR:** employee_profiles, attendance_records, leave_requests, leave_balances, kpi_definitions, kpi_scores, payroll_runs, payroll_slips
- **Support:** tickets, ticket_messages
- **System:** notifications, documents, audit_logs

---

## Business Rules

### Pakistan-Specific
- Currency: PKR | Fiscal year: July 1 – June 30 | Timezone: Asia/Karachi
- GST: 17% standard; WHT on services: 8% (filer) / 16% (non-filer); WHT on goods: 4.5% / 9%
- FBR e-invoicing: NTN, STRN, sequential invoice numbers, QR code
- Income tax: 0% up to 600K PKR, progressive slabs above
- COD (cash on delivery) is 60–70% of e-commerce volume — must be first-class in UX and workflow
- Payment methods: COD, JazzCash, Easypaisa, bank transfer, credit card
- EOBI: employer + employee contributions included in payroll

### Real Estate (OZ Developers)
- Projects: Bahria Sky, Bahria Sky 2, Lahore Sky, OZ Square
- Unit types: apartments (1/2/3-bed, penthouse, studio), shops (S/M/L), showrooms, offices, parking
- Installment plans: configurable down payment %, number of installments, frequency
- Overseas investors: multi-currency display (AUD, AED, GBP, USD, KWD), timezone-aware comms
- Commissions: milestone-based (on booking, on 50% collection, on possession)

### Automotive (WiseWheels)
- Vehicle attributes: make, model, year, variant, mileage, fuel type, transmission, engine CC, body type, color, registration city, owners count
- Inspection: 150+ point checklist, min fee PKR 2,500, photo evidence, 1–5 star rating
- Dealer tiers with featured listing packages

---

## Coding Standards

- TypeScript strict mode everywhere — no `any`
- Use Server Components by default in Next.js; `"use client"` only when interactivity requires it
- All DB operations through Prisma — raw SQL only for complex aggregate reports
- All API responses use the standard envelope `{ success, data, error, meta }`
- Zod schemas defined once in `packages/shared`, imported everywhere
- Structured JSON logs with `requestId` on every log line
- All env vars from `.env` — never hardcoded

---

## Scope Exclusions (do NOT build)

- Customer-facing iOS/Android native apps — only the employee app uses React Native
- POS system
- AI/ML chatbot — mock the UI only, no actual LLM integration
- Live payment gateway calls — use a mock payment processor
- Live courier API — mock tracking responses
- Live WhatsApp Business API — build the service layer, use mock sends
- Live SMS — `console.log` stub, build the abstraction
- White-label custom domains — architecture-ready, UI deferred
- Social media management tools
- AR product preview

---

## End-to-End Acceptance Criteria

The platform is "done" when these flows work without errors:

1. Register tenant → Login → See dashboard
2. Add product → Set stock → Customer places order → Admin updates status → Generate invoice → Record payment → Appears in P&L report
3. Create RE project → Add units → Customer books unit → Generate installment schedule → Record installment payment → Visible in collection dashboard
4. Create vehicle listing → Buyer searches → Books inspection → Inspector completes checklist → Report generated
5. Employee checks in (geo-fenced) → Applies leave → Manager approves → Payroll runs → Payslip generated
6. Executive dashboard shows real-time KPIs across all 3 verticals
