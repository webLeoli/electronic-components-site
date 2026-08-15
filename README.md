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
npm run db:maintain          # refresh isProgrammableLogic + VACUUM ANALYZE "Product"
npm run db:search-indexes    # build the trigram GIN indexes CONCURRENTLY (production)
npm run data:purge-pii       # PII retention pass (add -- --dry-run to preview)
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
| `post-import-maintenance.mjs` | Shared post-write maintenance; every importer calls it automatically. |
| `flag-programmable-logic.mjs` | Standalone entry for the same maintenance (`npm run db:maintain`). |
| `add-search-indexes.mjs` | Build the pg_trgm GIN indexes without locking a live table. |
| `purge-pii.mjs` | Enforce the privacy policy's retention windows (run monthly). |
| `restore-backup.mjs` | Restore an admin backup export. |
| `audit-data-quality.mjs` | Read-only check for duplicate brands, duplicate parts and thin content (`npm run data:audit`). Run after every bulk import. |
| `merge-manufacturers.mjs` / `dedupe-part-numbers.mjs` | Apply the brand alias table / consolidate punctuation-variant part numbers. Dry run by default. |
| `fix-distributor-copy.mjs` / `fix-misattributed-parts.mjs` | Repair generated copy that credits a distributor as the maker; reassign parts filed under the wrong brand. |
| `compact-product-table.mjs` | `VACUUM FULL` after bulk migrations — plain VACUUM never returns the space, and scan-bound search pays for it. Locks the table. |
| `smoke-check.mjs` | Post-deploy assertions against the public URL (encoded-slash routing, redirects). Run by `update.sh` when `HEALTH_URL` is set. |

## Production Deploy

On the VPS:

```bash
cd /opt/fpgacenter && FULL_CLEAN=1 SKIP_DB=1 STOP_APP_BEFORE_BUILD=1 APP_NAME=fpgacenter NODE_OPTIONS="--max-old-space-size=6144" bash update.sh
```

`FULL_CLEAN=1` removes untracked/ignored junk and rebuilds the project while preserving `.env`, uploads, and storage directories.

Add `HEALTH_URL=https://fpgacenter.com/api/health` so the deploy verifies the app
answers a real database query (`SELECT 1`) after restart instead of only checking
that the process started.

Setting `HEALTH_URL` also runs `scripts/smoke-check.mjs` against the public URL,
which asserts things that only break in front of the proxy — see **Reverse proxy
requirements** below. `SKIP_SMOKE=1` bypasses it.

### Reverse proxy requirements

**The proxy must pass the raw, still-encoded request URI through to Node.**
59,869 part numbers contain `/` (e.g. `PIC16F877A-I/P`, `TJA1028T/5V0/20:11`), so
their pages live at URLs carrying `%2F`:

```
/product/microchip/PIC16F877A-I%2FP
```

Next.js serves these correctly. nginx does not, if the `location` block rewrites
the URI — it decodes `%2F` into a real slash first, the route no longer matches,
and roughly 8% of the catalogue 404s. Nothing in a build or a homepage health
check catches it.

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;      # no trailing slash, no rewrite
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    client_max_body_size 12m;              # quote form BOM cap (10MB) + envelope
}
```

A trailing slash on `proxy_pass` (`http://127.0.0.1:3000/`) or any `rewrite` in
the same block makes nginx rebuild the URI from the decoded path and breaks these
URLs. The smoke check fails loudly when that happens; it also covers `#`, `+` and
spaces in part numbers, which a WAF is equally likely to mangle.

`Host $host` is required, not cosmetic: the admin panel's CSRF check compares the
browser's `Origin` against the host the request was addressed to. Passing a
literal (`proxy_set_header Host 127.0.0.1:3000`) makes every admin write 403.

`client_max_body_size` is the only thing that stops an oversized upload before
Node buffers it. The app rejects an over-length body with 413 without reading
it, but that check reads `Content-Length`, which a chunked request simply omits.
nginx's default is 1m — too small for the 10MB BOM the quote form advertises, so
it must be raised here and not left implicit.

**Behind a CDN, set `TRUSTED_PROXY_HOPS=2`.** Rate limits and the `ipAddress`
stored on leads key on the client address counted back from the end of
`X-Forwarded-For`, which assumes exactly one proxy of ours (nginx) appended the
address it saw. Add a CDN in front and every visitor keys to the CDN's address
instead: the quote form's "3 per hour" becomes 3 per hour for the whole site and
one attacker can lock every admin out of login. It fails silently — the logs show
ordinary 429s. Set the variable to the number of proxies of your own, and
restrict the origin to the CDN's address ranges at the firewall, since anyone
able to reach the origin directly can forge the entry the app reads.

`SESSION_SECRET` is mandatory - the app refuses to boot without it. There is no
fallback secret any more, so a deploy that loses `.env` fails loudly instead of
silently accepting forged admin sessions.

**Run one instance, or set `REDIS_URL`.** Rate limiting (quote form, contact
form, search) falls back to a per-process in-memory counter when `REDIS_URL` is
unset. That is correct for the current single-instance PM2 setup, but starting
the app in cluster mode (`pm2 start -i max`) gives every worker its own counter
and multiplies every quota by the worker count — the quote form's "3 per hour"
becomes 3 per hour *per worker*. The limiter logs a warning when it detects a PM2
instance index without Redis, so this shows up in the logs instead of silently
weakening the limits.

The deploy runs `prisma db push`, which makes the database match `schema.prisma`
exactly and **drops any index the schema does not declare**. All indexes,
including the trigram GIN ones, are declared in the schema. On a live database,
build them first with `npm run db:search-indexes` (CONCURRENTLY, no table lock,
safe to re-run) so `db push` finds them already present.

## Scheduled Maintenance

| Cadence | Command | Why |
| --- | --- | --- |
| Monthly | `npm run data:purge-pii` | Enforces the 24-month anonymization and 30-day spam-deletion windows promised on the privacy page. |
| After any out-of-band bulk SQL edit | `npm run db:maintain` | Refreshes `isProgrammableLogic` and merges the GIN pending lists. The importers do this automatically; hand-written SQL does not. |

Example crontab entry on the VPS (02:30 on the 1st of each month):

```text
30 2 1 * * cd /opt/fpgacenter && /usr/bin/npm run data:purge-pii >> /var/log/fpgacenter-purge.log 2>&1
```

## Data Sync

Code is synced with Git. Products, categories, manufacturers, blogs, and safe SEO settings are synced with safe data packages.

See `docs/production-data-sync.md`.

The data sync tools never import or export RFQ submissions, contact submissions, admin users, environment secrets, uploaded files, logs, or build artifacts.
