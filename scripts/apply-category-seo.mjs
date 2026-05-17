/**
 * Write generated seoTitle + seoDesc to Category rows.
 *
 * This is safe to run concurrently with the Product description rollout
 * (apply-new-descriptions.mjs) because it only writes to the Category table.
 *
 * Usage:
 *   node scripts/apply-category-seo.mjs --dry-run
 *   node scripts/apply-category-seo.mjs --overwrite           # also overwrite categories that already have seoDesc/Title
 *   node scripts/apply-category-seo.mjs --slug=fpgas          # single category for testing
 *   node scripts/apply-category-seo.mjs --ids-out=cat-ids.txt
 *
 * Default behaviour: skip categories where existingSeoDesc or existingSeoTitle
 * is already set (assumes any pre-existing value was hand-curated).
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { buildCategorySeo } from '../src/lib/category-seo.js';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN   = args.includes('--dry-run');
const OVERWRITE = args.includes('--overwrite');
const SLUG_ARG  = args.find(a => a.startsWith('--slug='));
const SLUG      = SLUG_ARG ? SLUG_ARG.split('=')[1] : null;
const IDS_OUT_ARG = args.find(a => a.startsWith('--ids-out='));
const IDS_OUT     = IDS_OUT_ARG ? IDS_OUT_ARG.split('=')[1] : null;

if (IDS_OUT && !DRY_RUN) writeFileSync(IDS_OUT, '');
let idsWritten = 0;
function recordId(id) {
  if (!IDS_OUT || DRY_RUN) return;
  appendFileSync(IDS_OUT, (idsWritten === 0 ? '' : ',') + id);
  idsWritten++;
}

(async () => {
  const snapshot = JSON.parse(readFileSync('scripts/categories-snapshot.json', 'utf8'));
  const filtered = SLUG ? snapshot.filter(s => s.slug === SLUG) : snapshot;

  console.log(`Mode:        ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`);
  console.log(`Overwrite:   ${OVERWRITE}`);
  console.log(`Target slug: ${SLUG || '(all)'}`);
  console.log(`Categories:  ${filtered.length}`);
  console.log('');

  let attempted = 0, updated = 0, skipped = 0, empty = 0;
  let titleChanged = 0, descChanged = 0;

  for (const cat of filtered) {
    attempted++;
    const seo = buildCategorySeo(cat);
    if (!seo.seoTitle && !seo.seoDesc) { empty++; continue; }

    // Skip if existing copy is set and --overwrite not passed
    if (!OVERWRITE && (cat.existingSeoTitle || cat.existingSeoDesc)) {
      skipped++;
      continue;
    }

    if (DRY_RUN) {
      if (updated < 10) {
        console.log(`[dry] ${cat.slug}`);
        console.log(`  T: ${seo.seoTitle}`);
        console.log(`  D: ${seo.seoDesc}`);
      }
    } else {
      recordId(cat.id);
      await prisma.category.update({
        where: { id: cat.id },
        data: {
          seoTitle: seo.seoTitle,
          seoDesc:  seo.seoDesc,
        },
      });
      if (cat.existingSeoTitle !== seo.seoTitle) titleChanged++;
      if (cat.existingSeoDesc  !== seo.seoDesc)  descChanged++;
    }
    updated++;
  }

  console.log(`\n=== Done ===`);
  console.log(`Attempted:        ${attempted}`);
  console.log(`${DRY_RUN ? 'Would update' : 'Updated'}:     ${updated}`);
  console.log(`Skipped (had):    ${skipped}`);
  console.log(`Skipped (empty):  ${empty}`);
  if (!DRY_RUN) {
    console.log(`Titles changed:   ${titleChanged}`);
    console.log(`Descs changed:    ${descChanged}`);
  }
  if (IDS_OUT && !DRY_RUN) console.log(`Category IDs:     ${IDS_OUT} (${idsWritten} ids)`);

  await prisma.$disconnect();
})();
