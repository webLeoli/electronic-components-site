# scripts/archive

One-off and superseded scripts from past data/SEO campaigns (audits, description
rewrites, manufacturer/brand restores, classification passes, seed batches) and
their output artifacts (`*.txt`, `*.json` snapshots).

They are kept for reference and reproducibility but are **not** part of the
regular workflow. Nothing in `src/` or `package.json` depends on them.

Actively-used scripts live one level up in `scripts/`:

| Script | Purpose |
| --- | --- |
| `export-safe-data-package.mjs` / `import-safe-data-package.mjs` | `npm run data:export` / `data:import` |
| `repair-product-sitemap-indexing.mjs` | `npm run data:repair-sitemap` |
| `safe-data-package-lib.mjs` | shared lib for the export/import pair |
| `compute-quality-scores.mjs` / `rescore-subset.mjs` | (re)compute quality scores → `indexable` |
| `set-indexing-policy.mjs` | adjust the indexing threshold / toggle |
| `import-jsonl.mjs` / `import-products.mjs` / `import-blog-drafts.mjs` / `import-template.csv` | data import |
| `seed.mjs` / `setup-categories.mjs` / `sync-manufacturers.mjs` | base setup |

If you need one of the archived scripts again, move it back up to `scripts/`.
