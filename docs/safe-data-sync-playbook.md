# Safe Data Sync Playbook

This is the low-risk data publishing flow for FPGACenter.

## What It Syncs

- `Product`
- `Category`
- `Manufacturer`
- `BlogCategory`
- `BlogPost`
- SEO/indexing `AdminSetting` keys only:
  - `robots_txt`
  - `sitemap_urls`
  - `quality_index_threshold`
  - `quality_indexing_disabled`

## What It Never Syncs

- `RfqSubmission`
- `ContactSubmission`
- `AdminUser`
- `.env`
- uploaded files
- build output
- logs

## First Repair Product Sitemaps

If `/sitemap.xml` has no `products-*.xml`, repair the `indexable` flags on the server:

```bash
cd /opt/fpgacenter
node scripts/repair-product-sitemap-indexing.mjs --threshold=70
curl -s "http://127.0.0.1:3000/sitemap.xml?fresh=$(date +%s)" | grep products- | head
```

If the repair says no products became indexable, recompute scores:

```bash
cd /opt/fpgacenter
node scripts/compute-quality-scores.mjs --threshold=70
```

## Export A Data Package Locally

```bash
cd "D:\脚本案例\electronic-components-site"
node scripts\export-safe-data-package.mjs
```

The output goes to `data-packages/fpgacenter-data-YYYYMMDD-HHMMSS`.

To export only product/category/manufacturer data:

```bash
node scripts\export-safe-data-package.mjs --tables=categories,manufacturers,products
```

To export blog content too:

```bash
node scripts\export-safe-data-package.mjs --tables=categories,manufacturers,products,blog
```

## Upload To Server

Upload the generated package directory to:

```text
/opt/fpgacenter/imports/
```

Example:

```bash
scp -r data-packages/fpgacenter-data-YYYYMMDD-HHMMSS root@SERVER:/opt/fpgacenter/imports/
```

## Validate On Server

Validation reads the package and writes nothing:

```bash
cd /opt/fpgacenter
node scripts/import-safe-data-package.mjs imports/fpgacenter-data-YYYYMMDD-HHMMSS
```

## Apply On Server

This creates a backup first, then imports only the safe tables:

```bash
cd /opt/fpgacenter
node scripts/import-safe-data-package.mjs imports/fpgacenter-data-YYYYMMDD-HHMMSS --apply
```

Then verify:

```bash
curl -s "http://127.0.0.1:3000/sitemap.xml?fresh=$(date +%s)" | grep products- | head
curl -s "http://127.0.0.1:3000/sitemap/products-1.xml?fresh=$(date +%s)" | grep -c "<url>"
```

No rebuild is required after a pure data import because sitemap routes read the database dynamically.
