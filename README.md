# FPGACenter — Electronic Component Sourcing Platform

A Next.js 16 production platform for sourcing hard-to-find, obsolete, and in-demand electronic components (FPGAs, ICs, passives, etc.).

## Tech Stack

- **Framework**: Next.js 16.2 (App Router, Turbopack)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: Cookie-based session (httpOnly, bcrypt)
- **Email**: Nodemailer (SMTP)
- **Styling**: Vanilla CSS

## Quick Start

```bash
# Install
npm install

# Configure environment
cp .env.example .env   # then edit .env with your DB, SMTP, secrets

# Initialize database
npx prisma migrate dev

# Seed initial data (optional)
node scripts/seed.mjs

# Dev server
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `ADMIN_PASSWORD` | ✅ | Legacy single-admin password |
| `SESSION_SECRET` | ✅ | HMAC secret for session signing — change in production! |
| `SMTP_HOST/PORT/USER/PASS` | Optional | Email notification via nodemailer |
| `SMTP_FROM` | Optional | Sender address for emails |
| `ADMIN_EMAIL` | Optional | Admin notification recipient |
| `SITE_URL` | Optional | Production domain URL |

## Project Structure

```
src/
  app/           # Next.js App Router pages + API routes
    api/admin/   # Admin API (all routes auth-protected)
    api/rfq/     # Public RFQ submission
    api/contact/ # Public contact form
    api/search/  # Public product search
    admin/       # Admin panel pages
  components/    # Shared UI components
  lib/           # Shared utilities
    admin-auth.js  # Session auth helpers
    db.js          # Prisma client singleton
    email.js       # SMTP email sender
    settings.js    # DB-backed settings with cache
    tracker.js     # Client-side analytics
middleware.js      # Route-level auth (admin pages + admin API)
prisma/schema.prisma
scripts/         # One-time seed / import scripts
```

## Admin Panel

Access at `/admin/login`. Three role levels:
- **admin** — full access
- **editor** — can manage content, cannot manage users/settings
- **viewer** — read-only

## Scripts

| Script | Purpose |
|---|---|
| `scripts/seed.mjs` | Seed categories, manufacturers, sample products |
| `scripts/seed-batch1/2/3.mjs` | Bulk product seeds |
| `scripts/seed-blog.mjs` | Seed blog articles |
| `scripts/import-products.mjs` | CSV import tool |
| `scripts/export-products.mjs` | CSV export tool |
| `scripts/bulk-update.mjs` | Batch product updates |
| `scripts/enrich-products-specs.mjs` | Enrich specs from external data |

## Commands

```bash
npm run dev    # Development server
npm run build  # Production build
npm run start  # Production server
npm run lint   # ESLint
```
