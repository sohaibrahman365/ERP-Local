# WisePlatform ERP

Multi-tenant SaaS ERP for WiseMarket (e-commerce), WiseWheels (automotive), and OZ Developers (real estate).

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Git

### Setup

```bash
# 1. Start infrastructure
docker compose up -d

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env

# 4. Run database migrations
cd packages/database
npx prisma migrate dev --name init
npx prisma generate

# 5. Seed demo data
npx prisma db seed

# 6. Start development
cd ../..
npm run dev
```

### Access
- **Web App:** http://localhost:3000
- **API Server:** http://localhost:4000
- **MinIO Console:** http://localhost:9001
- **Meilisearch:** http://localhost:7700

### Demo Credentials
- **Admin:** admin@wisemarket.com.pk / Admin@123
- **Sales Agent:** sales@wisemarket.com.pk / Sales@123
- **Finance:** finance@wisemarket.com.pk / Finance@123

## Architecture
See `CLAUDE.md` for complete development instructions.
See `docs/DATABASE_SCHEMA.md` for database models.

## License
Proprietary - All rights reserved.
