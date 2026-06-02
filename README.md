# FPGACenter

FPGACenter is a Next.js sourcing site for FPGA, CPLD, obsolete IC, and hard-to-find electronic component inquiries.

## Stack

- Next.js 16 App Router
- React 19
- PostgreSQL
- Prisma ORM
- Cookie-based admin sessions
- Nodemailer SMTP notifications
- Plain CSS

## Local Setup

```bash
npm install
npx prisma generate
npm run dev
```

Create `.env` before running the app. Required production values include:

- `DATABASE_URL`
- `SESSION_SECRET`
- `SITE_URL`
- SMTP variables if RFQ/contact emails should be sent

## Main Commands

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run data:export
npm run data:import
```

`npm run build` uses `next build --webpack` because this is more stable on the current VPS than the default build path.

## Project Structure

```text
src/app/            Next.js pages and API routes
src/components/     shared UI components
src/lib/            database, SEO, analytics, and sourcing helpers
prisma/             Prisma schema and migrations
scripts/            active data import/export/repair scripts
docs/               current operational docs and blog drafts
public/             public static assets
update.sh           VPS deployment script
```

## Active Scripts

| Script | Purpose |
| --- | --- |
| `export-safe-data-package.mjs` | Export safe public content data. |
| `import-safe-data-package.mjs` | Import or replace safe public content data. |
| `repair-product-sitemap-indexing.mjs` | Repair product sitemap indexability flags. |
| `compute-quality-scores.mjs` / `rescore-subset.mjs` | Compute product quality and indexing scores. |
| `set-indexing-policy.mjs` | Show or update indexing threshold settings. |
| `import-products.mjs` / `import-jsonl.mjs` | Product data import tools. |
| `import-blog-drafts.mjs` | Import markdown drafts from `docs/blog-drafts`. |
| `seed.mjs` / `setup-categories.mjs` / `sync-manufacturers.mjs` | Base setup utilities. |

## Production Deploy

On the VPS:

```bash
cd /opt/fpgacenter && FULL_CLEAN=1 SKIP_DB=1 STOP_APP_BEFORE_BUILD=1 APP_NAME=fpgacenter NODE_OPTIONS="--max-old-space-size=6144" bash update.sh
```

`FULL_CLEAN=1` removes untracked/ignored junk and rebuilds the project while preserving `.env`, uploads, and storage directories.

## Data Sync

Code is synced with Git. Products, categories, manufacturers, blogs, and safe SEO settings are synced with safe data packages.

See `docs/production-data-sync.md`.

The data sync tools never import or export RFQ submissions, contact submissions, admin users, environment secrets, uploaded files, logs, or build artifacts.
